import { createHash } from 'node:crypto';
import { assertMySQL8 } from './version.js';

export function migrationStatements(sql) {
  const statements = sql.split('-- statement-breakpoint').map((part) => part.replace(/^\s*--.*$/gm, '').trim()).filter(Boolean);
  for (const statement of statements) {
    // Phase 1 runner accepts additive DDL only. New destructive/data migrations
    // require explicit design/review rather than an automatic escape hatch.
    if (!/^(CREATE TABLE|ALTER TABLE)\b/i.test(statement) ||
        /\b(DROP|TRUNCATE|DELETE|RENAME)\b/i.test(statement.replace(/\bON DELETE (RESTRICT|SET NULL|CASCADE|NO ACTION)\b/gi, ''))) {
      throw new Error('Only reviewed additive schema migrations are supported.');
    }
  }
  return statements;
}

export async function runMigrations(connection, migrations) {
  await assertMySQL8(connection);
  const [[{ acquired }]] = await connection.query("SELECT GET_LOCK('sudha_tourism_migrations', 10) AS acquired");
  if (Number(acquired) !== 1) throw new Error('Could not acquire migration lock.');
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(190) NOT NULL PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    const [applied] = await connection.query('SELECT name, checksum FROM schema_migrations');
    const known = new Map(applied.map((row) => [row.name, row.checksum]));
    const sorted = [...migrations].sort((a, b) => a.name.localeCompare(b.name));
    const available = new Map(sorted.map((item) => [item.name, item]));
    if (available.size !== sorted.length) throw new Error('Duplicate migration names.');
    for (const [name] of known) {
      if (!available.has(name)) throw new Error('An applied migration is missing.');
    }
    // Validate the whole plan before applying anything.
    const plan = sorted.map((item) => ({
      ...item,
      checksum: createHash('sha256').update(item.sql).digest('hex'),
      statements: migrationStatements(item.sql)
    }));
    for (const item of plan) {
      if (known.has(item.name) && known.get(item.name) !== item.checksum) throw new Error('An applied migration was changed.');
      if (!known.has(item.name) && [...known.keys()].some((name) => name > item.name)) throw new Error('Migration added out of sequence.');
    }
    for (const item of plan) {
      if (known.has(item.name)) continue;
      // MySQL DDL implicitly commits. Never claim multi-statement rollback.
      // Initial CREATE IF NOT EXISTS statements are retryable; later migrations
      // should use one atomic ALTER or explicitly document recovery.
      for (const statement of item.statements) await connection.query(statement);
      await connection.execute('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)', [item.name, item.checksum]);
      console.log(`Applied ${item.name}`);
    }
  } finally {
    await connection.query("SELECT RELEASE_LOCK('sudha_tourism_migrations')");
  }
}
