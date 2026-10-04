import { pool } from '../db/pool.js';
import { createAdmin } from '../services/adminCreation.js';

try {
  const result = await createAdmin(pool, {email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD});
  console.log(JSON.stringify({event:'admin_created',id:result.id}));
} catch (error) {
  console.error(error.code === 'ADMIN_EXISTS' ? 'Admin already exists; no password was changed.' : 'Admin creation failed. Check database access and ADMIN_EMAIL/ADMIN_PASSWORD (12+ characters, uppercase, lowercase, number, symbol).');
  process.exitCode = 1;
} finally { await pool.end(); }
