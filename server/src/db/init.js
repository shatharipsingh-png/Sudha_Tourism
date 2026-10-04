import mysql from 'mysql2/promise';
import { dbEnv } from '../config/database.js';
import { assertMySQL8 } from './version.js';

async function main() {
  const connection = await mysql.createConnection({
    host: dbEnv.DB_HOST, port: dbEnv.DB_PORT,
    user: dbEnv.DB_USER, password: dbEnv.DB_PASSWORD,
    connectTimeout: 10000
  });
  try {
    await assertMySQL8(connection);
    // Identifier placeholder is escaped by mysql2, not interpolated input.
    await connection.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [dbEnv.DB_NAME]);
    console.log('Database initialized.');
  } finally { await connection.end(); }
}
main().catch(() => { console.error('Database initialization failed. Check configuration and database creation privileges.'); process.exitCode = 1; });
