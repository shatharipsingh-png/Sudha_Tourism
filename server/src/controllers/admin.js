import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { safeJsonParse } from '../utils/json.js';
import { ok, fail } from '../utils/response.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60 * 1000,
  path: '/'
};

const dummyPasswordHash = bcrypt.hashSync('not-an-admin-password', 12);

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute('SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1', [email]);
    const admin = rows[0];
    const matches = await bcrypt.compare(password, admin?.password_hash ?? dummyPasswordHash);
    if (!admin || !matches) return fail(res, 401, 'Invalid email or password');

    const token = jwt.sign({ sub: String(admin.id) }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '8h' });
    res.cookie('st_admin', token, cookieOptions);
    return ok(res, { id: admin.id, email: admin.email }, 'Logged in.');
  } catch (error) { next(error); }
}

export function logout(req, res) {
  res.clearCookie('st_admin', { httpOnly: true, sameSite: 'strict', secure: env.NODE_ENV === 'production', path: '/' });
  return ok(res, null, 'Logged out.');
}

export function me(req, res) {
  return ok(res, req.admin, 'Admin retrieved.');
}

export async function listLeads(req, res, next) {
  try {
    const { type, status, page, limit } = req.query;
    const conditions = [];
    const params = [];
    if (type) { conditions.push('l.type = ?'); params.push(type); }
    if (status) { conditions.push('l.status = ?'); params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM leads l ${where}`, params);
    const total = Number(countRows[0].total);
    // Text protocol avoids mysql2/MySQL prepared LIMIT binding issues.
    const [rows] = await pool.query(`
      SELECT l.id, l.type, l.name, l.email, l.phone, l.package_id, l.destination_id, l.travel_date, l.travelers,
             l.details, l.message, l.status, l.created_at, l.updated_at,
             p.title AS package_title, d.name AS destination_name
      FROM leads l
      LEFT JOIN packages p ON p.id = l.package_id
      LEFT JOIN destinations d ON d.id = l.destination_id
      ${where}
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return ok(res, {
      items: rows.map((row) => ({ ...row, details: safeJsonParse(row.details, null) })),
      page, limit, total, totalPages: Math.ceil(total / limit)
    }, 'Leads retrieved.');
  } catch (error) { next(error); }
}
