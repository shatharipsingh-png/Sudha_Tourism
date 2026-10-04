import { z } from 'zod';
import { parseConfig } from '../config/database.js';
import { pool } from './pool.js';
import { seedDatabase } from './seedRunner.js';

async function main() {
  let admin;
  if (process.env.ADMIN_EMAIL || process.env.ADMIN_PASSWORD) {
    admin = parseConfig(z.object({
      email: z.string().trim().toLowerCase().email().max(320),
      password: z.string().min(12).max(72)
    }), { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    if (Buffer.byteLength(admin.password, 'utf8') > 72) throw new Error('Seed admin password exceeds bcrypt limit.');
  }
  const connection = await pool.getConnection();
  try { await seedDatabase(connection, admin); console.log('Non-destructive seed completed.'); }
  finally { connection.release(); }
}
main().catch(() => {
  console.error('Seed failed. Verify migrations, database access and optional admin seed configuration.');
  process.exitCode = 1;
}).finally(() => pool.end());
