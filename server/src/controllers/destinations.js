import { pool } from '../db/pool.js';
import { safeJsonParse } from '../utils/json.js';
import { ok, fail } from '../utils/response.js';

export async function listDestinations(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT id, slug, name, region, short_desc, image, featured, sort
      FROM destinations
      ORDER BY sort ASC, name ASC
    `);
    return ok(res, rows, 'Destinations retrieved.');
  } catch (error) { next(error); }
}

export async function getDestination(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM destinations WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!rows.length) return fail(res, 404, 'Destination not found.');
    const destination = rows[0];
    for (const key of ['why_visit', 'top_places', 'travel_info']) destination[key] = safeJsonParse(destination[key], key === 'travel_info' ? {} : []);

    const [packages] = await pool.execute(`
      SELECT id, slug, title, route, category, duration_days, price, rating, image, short_desc, best_seller, featured
      FROM packages
      WHERE destination_id = ? AND status = 'published'
      ORDER BY featured DESC, best_seller DESC, title ASC
    `, [destination.id]);
    return ok(res, { ...destination, packages }, 'Destination retrieved.');
  } catch (error) { next(error); }
}
