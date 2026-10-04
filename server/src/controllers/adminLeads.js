import { pool } from '../db/pool.js';
import { safeJsonParse } from '../utils/json.js';
import { ok, fail } from '../utils/response.js';

export async function getLead(req,res,next) {
  try {
    const [rows] = await pool.execute(`SELECT l.id, l.type, l.name, l.email, l.phone,
      l.package_id, l.destination_id, l.travel_date, l.travelers, l.details, l.message,
      l.status, l.created_at, l.updated_at, l.consent_at, l.unsubscribed_at,
      p.title AS package_title, d.name AS destination_name
      FROM leads l LEFT JOIN packages p ON p.id = l.package_id
      LEFT JOIN destinations d ON d.id = l.destination_id WHERE l.id = ?`, [req.params.id]);
    if (!rows.length) return fail(res,404,'Lead not found.');
    return ok(res,{...rows[0],details:safeJsonParse(rows[0].details,null)},'Lead retrieved.');
  } catch(error) { next(error); }
}
const transitions = {new:['contacted','closed'],contacted:['closed'],closed:['contacted']};
export async function updateLead(req,res,next) {
  try {
    const [rows] = await pool.execute('SELECT status FROM leads WHERE id = ?', [req.params.id]);
    if (!rows.length) return fail(res,404,'Lead not found.');
    const current = rows[0].status;
    const status = req.body.status;
    if (current !== status) {
      if (!transitions[current]?.includes(status)) return fail(res,409,'Invalid lead status transition.');
      const [result] = await pool.execute('UPDATE leads SET status = ? WHERE id = ? AND status = ?', [status,req.params.id,current]);
      if (!result.affectedRows) return fail(res,409,'Lead changed; reload before updating.');
    }
    return ok(res,{id:req.params.id,status},'Lead updated.');
  } catch(error) { next(error); }
}
