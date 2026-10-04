import { pool } from '../db/pool.js';
import { safeJsonParse } from '../utils/json.js';
import { ok, fail } from '../utils/response.js';

const cardFields = `p.id, p.slug, p.title, p.route, p.category, p.duration_days, p.price, p.rating, p.image, p.short_desc, p.best_seller, p.featured, d.name AS destination_name, d.slug AS destination_slug`;

export async function listPackages(req, res, next) {
  try {
    const { destination, category, duration, minPrice, maxPrice, best_seller, featured, page, limit } = req.query;
    const conditions = ["p.status = 'published'"];
    const params = [];

    if (destination) { conditions.push('d.slug = ?'); params.push(destination); }
    if (category) { conditions.push('p.category = ?'); params.push(category); }
    if (duration === 'short') conditions.push('p.duration_days <= 4');
    if (duration === 'medium') conditions.push('p.duration_days BETWEEN 5 AND 7');
    if (duration === 'long') conditions.push('p.duration_days >= 8');
    if (minPrice !== undefined) { conditions.push('p.price >= ?'); params.push(minPrice); }
    if (maxPrice !== undefined) { conditions.push('p.price <= ?'); params.push(maxPrice); }
    if (best_seller !== undefined) { conditions.push('p.best_seller = ?'); params.push(best_seller === 'true' ? 1 : 0); }
    if (featured !== undefined) { conditions.push('p.featured = ?'); params.push(featured === 'true' ? 1 : 0); }

    const where = conditions.join(' AND ');
    const offset = (page - 1) * limit;
    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM packages p JOIN destinations d ON d.id = p.destination_id WHERE ${where}`, params);
    const total = Number(countRows[0].total);
    // Validated integers are escaped by mysql2's text protocol.
    const [rows] = await pool.query(`SELECT ${cardFields} FROM packages p JOIN destinations d ON d.id = p.destination_id WHERE ${where} ORDER BY p.featured DESC, p.best_seller DESC, p.id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);

    return ok(res, { items: rows, page, limit, total, totalPages: Math.ceil(total / limit) }, 'Packages retrieved.');
  } catch (error) { next(error); }
}

export async function getPackage(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT p.*, d.name AS destination_name, d.slug AS destination_slug FROM packages p JOIN destinations d ON d.id = p.destination_id WHERE p.slug = ? AND p.status = 'published' LIMIT 1`, [req.params.slug]);
    if (!rows.length) return fail(res, 404, 'Package not found.');
    const pkg = rows[0];
    for (const key of ['gallery', 'highlights', 'itinerary', 'inclusions', 'exclusions', 'info']) pkg[key] = safeJsonParse(pkg[key], key === 'info' ? {} : []);
    pkg.destination = { name: pkg.destination_name, slug: pkg.destination_slug };
    delete pkg.destination_name;
    delete pkg.destination_slug;

    const [related] = await pool.execute(`
      SELECT ${cardFields} FROM packages p
      JOIN destinations d ON d.id = p.destination_id
      WHERE p.status = 'published' AND p.id <> ? AND (p.destination_id = ? OR p.category = ?)
      ORDER BY (p.destination_id = ?) DESC, p.featured DESC, p.best_seller DESC, p.id DESC
      LIMIT 3
    `, [pkg.id, pkg.destination_id, pkg.category, pkg.destination_id]);

    return ok(res, { ...pkg, related }, 'Package retrieved.');
  } catch (error) { next(error); }
}
