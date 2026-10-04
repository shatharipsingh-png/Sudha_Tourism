import { pool } from '../db/pool.js';
import { safeJsonParse } from '../utils/json.js';

// All SQL identifiers come from these private definitions, never request data.
const definitions = {
  destinations: { fields: ['slug','name','region','short_desc','description','image','why_visit','top_places','travel_info','featured','sort'], json: ['why_visit','top_places','travel_info'], order: 'sort ASC, name ASC, id ASC' },
  packages: { fields: ['slug','title','destination_id','route','category','duration_days','price','rating','image','gallery','short_desc','highlights','itinerary','inclusions','exclusions','info','best_seller','featured','status'], json: ['gallery','highlights','itinerary','inclusions','exclusions','info'], order: 'created_at DESC, id DESC' },
  experiences: { fields: ['slug','name','image','description','examples','sort'], json: ['examples'], order: 'sort ASC, name ASC, id ASC' }
};
function definition(entity) {
  const result = definitions[entity];
  if (!result) throw new Error('Unknown content entity.');
  return result;
}
function decode(entity, row) {
  const result = { ...row };
  for (const field of definition(entity).json) result[field] = safeJsonParse(row[field]);
  return result;
}
export function contentError(status, message) {
  return Object.assign(new Error(message), { status, expose: true });
}
async function checkDestination(db, input) {
  if (input.destination_id !== undefined) {
    const [rows] = await db.execute('SELECT id FROM destinations WHERE id = ?', [input.destination_id]);
    if (!rows.length) throw contentError(400, 'Invalid destination.');
  }
}
export async function listContent(entity, query) {
  const config = definition(entity);
  const conditions = [];
  const params = [];
  if (entity === 'packages') {
    for (const key of ['destination_id','category','status']) {
      if (query[key] !== undefined) { conditions.push(`${key} = ?`); params.push(query[key]); }
    }
  }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM ${entity}${where}`, params);
  const [rows] = await pool.query(`SELECT * FROM ${entity}${where} ORDER BY ${config.order} LIMIT ? OFFSET ?`, [...params, query.limit, (query.page - 1) * query.limit]);
  return { items: rows.map(row => decode(entity, row)), page: query.page, limit: query.limit, total: Number(total), totalPages: Math.ceil(Number(total) / query.limit) };
}
export async function getContent(entity, id) {
  definition(entity);
  const [rows] = await pool.execute(`SELECT * FROM ${entity} WHERE id = ?`, [id]);
  if (!rows.length) throw contentError(404, 'Content not found.');
  return decode(entity, rows[0]);
}
export async function saveContent(entity, input, id) {
  const config = definition(entity);
  const fields = config.fields.filter(field => Object.hasOwn(input, field));
  const params = fields.map(field => config.json.includes(field) ? JSON.stringify(input[field]) : input[field]);
  if (entity === 'packages') await checkDestination(pool, input);
  if (id === undefined) {
    const [result] = await pool.execute(`INSERT INTO ${entity} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, params);
    return getContent(entity, result.insertId);
  }
  // Existence check avoids reporting a no-op PATCH as missing with changedRows semantics.
  await getContent(entity, id);
  await pool.execute(`UPDATE ${entity} SET ${fields.map(field => `${field} = ?`).join(', ')} WHERE id = ?`, [...params, id]);
  return getContent(entity, id);
}
export async function deleteContent(entity, id) {
  definition(entity);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Parent lock serializes deletion against FK-backed child insert/update.
    const [rows] = await connection.execute(`SELECT id FROM ${entity} WHERE id = ? FOR UPDATE`, [id]);
    if (!rows.length) throw contentError(404, 'Content not found.');
    const references = entity === 'destinations'
      ? [['packages','destination_id'],['leads','destination_id']]
      : entity === 'packages' ? [['leads','package_id']] : [];
    for (const [table, field] of references) {
      const [linked] = await connection.execute(`SELECT id FROM ${table} WHERE ${field} = ? LIMIT 1`, [id]);
      if (linked.length) throw contentError(409, 'Content is referenced and cannot be deleted.');
    }
    await connection.execute(`DELETE FROM ${entity} WHERE id = ?`, [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
