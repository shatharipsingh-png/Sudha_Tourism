import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { fail } from '../utils/response.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.st_admin;
  if (!token) return fail(res, 401, 'Unauthorized.');

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const [rows] = await pool.execute('SELECT id, email FROM admins WHERE id = ? LIMIT 1', [payload.sub]);
    if (!rows.length) return fail(res, 401, 'Unauthorized.');
    req.admin = rows[0];
    next();
  } catch {
    return fail(res, 401, 'Unauthorized.');
  }
}
