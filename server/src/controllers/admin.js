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

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute('SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1', [email]);
    const admin = rows[0];
    const valid = admin ? await bcrypt.compare(password, admin.password_hash) : false;
    if (!valid) return fail(res, 401, 'Invalid credentials');

    const token = jwt.sign({ sub: admin.id }, env.JWT_SECRET, { expiresIn: '8h' });
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
    const [rows] = await pool.execute(`
      SELECT l.id, l.type, l.name, l.email, l.phone, l.package_id, l.destination_id, l.travel_date, l.travelers,
             l.details, l.message, l.status, l.created_at, l.updated_at,
             p.title AS package_title, d.name AS destination_name
      FROM leads l
      LEFT JOIN packages p ON p.id = l.package_id
      LEFT JOIN destinations d ON d.id = l.destination_id
      ${where}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return ok(res, {
      items: rows.map((row) => ({ ...row, details: safeJsonParse(row.details, null) })),
      page, limit, total, totalPages: Math.ceil(total / limit)
    }, 'Leads retrieved.');
  } catch (error) { next(error); }
}

export async function stats(req, res, next) {
  try {
    const [leadRows] = await pool.execute("SELECT type, COUNT(*) AS count FROM leads WHERE status = 'new' GROUP BY type");
    const [packageRows] = await pool.execute("SELECT COUNT(*) AS count FROM packages WHERE status = 'published'");
    const [destinationRows] = await pool.execute('SELECT COUNT(*) AS count FROM destinations');
    const byType = { enquiry: 0, booking: 0, contact: 0, newsletter: 0 };
    for (const row of leadRows) byType[row.type] = Number(row.count);
    return ok(res, {
      leadsByType: byType,
      totalPackages: Number(packageRows[0].count),
      totalDestinations: Number(destinationRows[0].count)
    }, 'Stats retrieved.');
  } catch (error) { next(error); }
}

export async function updateLead(req, res, next) {
  try {
    const [result] = await pool.execute('UPDATE leads SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    if (!result.affectedRows) return fail(res, 404, 'Lead not found.');
    return ok(res, { id: Number(req.params.id), status: req.body.status }, 'Lead updated.');
  } catch (error) { next(error); }
}
