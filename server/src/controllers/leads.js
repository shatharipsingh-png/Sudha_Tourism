import crypto from 'node:crypto';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';
import { ok, fail } from '../utils/response.js';
import { notifications } from '../services/notifications/index.js';

function hashIp(ip) {
  return crypto.createHash('sha256').update(`${ip}${env.IP_SALT}`).digest('hex');
}

async function exists(table, id) {
  const [rows] = await pool.execute(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`, [id]);
  return rows.length > 0;
}

async function publishedPackage(id) {
  const [rows] = await pool.execute("SELECT id FROM packages WHERE id = ? AND status = 'published' LIMIT 1", [id]);
  return rows.length > 0;
}

export async function createLead(req, res, next) {
  try {
    if (req.body.website) return ok(res, { id: null }, 'Lead received.');

    const input = req.body;
    if (input.destination_id && !(await exists('destinations', input.destination_id))) return fail(res, 400, 'Invalid destination.');
    if (input.package_id) {
      const valid = input.type === 'booking' ? await publishedPackage(input.package_id) : await exists('packages', input.package_id);
      if (!valid) return fail(res, 400, input.type === 'booking' ? 'Package is not available.' : 'Invalid package.');
    }

    if (input.type === 'newsletter') {
      await pool.execute(`INSERT INTO leads (type, email, consent_at, ip_hash)
        VALUES ('newsletter', ?, CURRENT_TIMESTAMP, ?)
        ON DUPLICATE KEY UPDATE id = id`, [input.email, hashIp(req.ip)]);
      return ok(res, { id: null }, 'Lead received.');
    }

    const details = input.details ?? null;
    const [result] = await pool.execute(`
      INSERT INTO leads (type, name, email, phone, package_id, destination_id, travel_date, travelers, details, message, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      input.type,
      input.name ?? null,
      input.email,
      input.phone ?? null,
      input.package_id ?? null,
      input.destination_id ?? null,
      input.travel_date ?? null,
      input.travelers ?? null,
      details ? JSON.stringify(details) : null,
      input.message ?? null,
      hashIp(req.ip)
    ]);

    const event = { ...input, id:result.insertId, created_at:new Date().toISOString() };
    res.once('finish', () => {
      // Work is scheduled after the saved lead's response; no transport error
      // can propagate into the lead HTTP request or its database write.
      setImmediate(() => {
        Promise.resolve().then(() => notifications.leadCreated(event)).catch(() => {
          console.error(JSON.stringify({event:'lead_notification_failed'}));
        });
      });
    });
    return ok(res, { id: result.insertId }, 'Lead received.');
  } catch (error) { next(error); }
}
