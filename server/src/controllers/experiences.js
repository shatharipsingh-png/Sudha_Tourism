import { pool } from '../db/pool.js';
import { safeJsonParse } from '../utils/json.js';
import { ok } from '../utils/response.js';

export async function listExperiences(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT id, slug, name, image, description, examples, sort FROM experiences ORDER BY sort ASC, name ASC');
    return ok(res, rows.map((row) => ({ ...row, examples: safeJsonParse(row.examples, []) })), 'Experiences retrieved.');
  } catch (error) { next(error); }
}
