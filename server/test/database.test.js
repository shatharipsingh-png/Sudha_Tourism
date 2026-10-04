import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { runMigrations, migrationStatements } from '../src/db/migrationRunner.js';
import { seedDatabase } from '../src/db/seedRunner.js';
import { assertMySQL8 } from '../src/db/version.js';

function migrationFake() {
  const ledger = new Map();
  const executed = [];
  let fail = false;
  return {
    ledger, executed, setFail(value) { fail = value; },
    async query(sql) {
      if (sql.startsWith('SELECT VERSION')) return [[{ version: '8.4.11' }]];
      if (sql.includes('GET_LOCK')) return [[{ acquired: 1 }]];
      if (sql.includes('RELEASE_LOCK')) return [[{ released: 1 }]];
      if (sql.startsWith('SELECT name')) return [[...ledger].map(([name, checksum]) => ({ name, checksum }))];
      if (sql.startsWith('CREATE TABLE IF NOT EXISTS schema_migrations')) return [[]];
      if (fail) throw new Error('DDL failure');
      executed.push(sql);
      return [[]];
    },
    async execute(sql, [name, checksum]) { ledger.set(name, checksum); return [{}]; }
  };
}
test('migrations run sequentially exactly once and detect checksum changes', async () => {
  const connection = migrationFake();
  const migrations = [
    { name: '002_second.sql', sql: 'ALTER TABLE first ADD COLUMN value INT;' },
    { name: '001_first.sql', sql: 'CREATE TABLE IF NOT EXISTS first (id INT);' }
  ];
  await runMigrations(connection, migrations);
  await runMigrations(connection, migrations);
  assert.equal(connection.executed.length, 2);
  assert.match(connection.executed[0], /CREATE TABLE/);
  assert.deepEqual([...connection.ledger.keys()], ['001_first.sql', '002_second.sql']);
  await assert.rejects(runMigrations(connection, [{ ...migrations[0], sql: 'ALTER TABLE first ADD COLUMN changed INT;' }, migrations[1]]), /changed/);
});

test('failed migration is not recorded and can be retried', async () => {
  const connection = migrationFake();
  const migrations = [{ name: '001_first.sql', sql: 'CREATE TABLE IF NOT EXISTS first (id INT);' }];
  connection.setFail(true);
  await assert.rejects(runMigrations(connection, migrations), /DDL failure/);
  assert.equal(connection.ledger.size, 0);
  connection.setFail(false);
  await runMigrations(connection, migrations);
  assert.equal(connection.ledger.size, 1);
});

test('migration guard rejects destructive SQL and real files are additive', async () => {
  assert.throws(() => migrationStatements('DROP TABLE leads;'), /additive/);
  assert.throws(() => migrationStatements('ALTER TABLE leads DROP COLUMN email;'), /additive/);
  for (const name of ['001_initial_schema.sql', '002_newsletter_consent.sql']) {
    const sql = await fs.readFile(new URL(`../src/db/migrations/${name}`, import.meta.url), 'utf8');
    assert.ok(migrationStatements(sql).length > 0);
  }
  const newsletter = await fs.readFile(new URL('../src/db/migrations/002_newsletter_consent.sql', import.meta.url), 'utf8');
  assert.match(newsletter, /UNIQUE KEY uq_leads_newsletter_email/);
});

test('seed repeated twice preserves lead data and edited catalog/admin records', async () => {
  const tables = { destinations: new Map(), packages: new Map(), experiences: new Map(), admins: new Map([['admin@example.test', 'existing-password']]), leads: [{ id: 77, message: 'Keep this lead' }] };
  const statements = [];
  const connection = {
    async query() { return [[{ version: '8.4.11' }]]; },
    async beginTransaction() {}, async commit() {}, async rollback() { assert.fail('Unexpected rollback'); },
    async execute(sql, params) {
      statements.push(sql);
      if (sql.startsWith('SELECT name')) return [[{ name: '002_newsletter_consent.sql' }]];
      if (sql.startsWith('SELECT id FROM destinations')) return [[{ id: tables.destinations.get(params[0]).id }]];
      const table = sql.match(/INSERT INTO (\w+)/)?.[1];
      assert.ok(table);
      assert.match(sql, /ON DUPLICATE KEY UPDATE (slug = slug|email = email)/);
      if (!tables[table].has(params[0])) tables[table].set(params[0], { id: tables[table].size + 1 });
      return [{ insertId: 1 }];
    }
  };
  await seedDatabase(connection, { email: 'admin@example.test', password: 'test-password-123456' });
  tables.destinations.get('rajasthan').custom = 'owner edit';
  await seedDatabase(connection, { email: 'admin@example.test', password: 'different-password-123' });
  assert.equal(tables.destinations.size, 5);
  assert.equal(tables.packages.size, 7);
  assert.equal(tables.experiences.size, 6);
  assert.equal(tables.admins.get('admin@example.test'), 'existing-password');
  assert.equal(tables.destinations.get('rajasthan').custom, 'owner edit');
  assert.deepEqual(tables.leads, [{ id: 77, message: 'Keep this lead' }]);
  assert.ok(statements.every((sql) => !/DROP|TRUNCATE|DELETE|INSERT INTO leads/.test(sql)));
});

test('seed rolls back catalog inserts on failure', async () => {
  let rolledBack = false;
  let committed = false;
  const connection = {
    async query() { return [[{ version: '8.4.11' }]]; },
    async execute(sql) { if (sql.startsWith('SELECT name')) return [[{ name: '002_newsletter_consent.sql' }]]; throw new Error('insert failed'); },
    async beginTransaction() {}, async commit() { committed = true; }, async rollback() { rolledBack = true; }
  };
  await assert.rejects(seedDatabase(connection), /insert failed/);
  assert.equal(rolledBack, true);
  assert.equal(committed, false);
});

test('MySQL version guard rejects unsupported database family', async () => {
  for (const version of ['5.7.44', '10.11-MariaDB']) {
    await assert.rejects(assertMySQL8({ async query() { return [[{ version }]]; } }));
  }
});
