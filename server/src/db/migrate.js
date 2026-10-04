import fs from 'node:fs/promises';
import { pool } from './pool.js';
import { runMigrations } from './migrationRunner.js';

async function main() {
  const directory = new URL('./migrations/', import.meta.url);
  const names = (await fs.readdir(directory)).filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name));
  const migrations = [];
  for (const name of names) migrations.push({ name, sql: await fs.readFile(new URL(name, directory), 'utf8') });
  const connection = await pool.getConnection();
  try { await runMigrations(connection, migrations); }
  finally { connection.release(); }
}
main().catch(() => {
  console.error('Migration failed. Review database state and migration prerequisites; no failed migration was marked successful.');
  process.exitCode = 1;
}).finally(() => pool.end());
