import { pool } from '../db/pool.js';
import { ok } from '../utils/response.js';

export async function stats(req,res,next) {
  try {
    const [groups] = await pool.execute('SELECT type, status, COUNT(*) AS count FROM leads GROUP BY type, status');
    const leadsByType = {enquiry:0,booking:0,contact:0,newsletter:0};
    const newLeadsByType = {...leadsByType};
    const statuses = {new:0,contacted:0,closed:0};
    for (const row of groups) {
      const count = Number(row.count);
      leadsByType[row.type] += count;
      statuses[row.status] += count;
      if (row.status === 'new') newLeadsByType[row.type] += count;
    }
    const [[counts]] = await pool.execute(`SELECT
      (SELECT COUNT(*) FROM destinations) AS totalDestinations,
      (SELECT COUNT(*) FROM packages) AS totalPackages,
      (SELECT COUNT(*) FROM packages WHERE status = 'published') AS publishedPackages,
      (SELECT COUNT(*) FROM experiences) AS totalExperiences`);
    const [recentLeads] = await pool.query('SELECT id, type, name, status, created_at FROM leads ORDER BY created_at DESC, id DESC LIMIT 5');
    return ok(res,{
      totalLeads:Object.values(statuses).reduce((sum,count)=>sum+count,0),
      newLeads:statuses.new, contactedLeads:statuses.contacted, closedLeads:statuses.closed,
      leadsByType,newLeadsByType,recentLeads,
      ...Object.fromEntries(Object.entries(counts).map(([key,value])=>[key,Number(value)]))
    },'Stats retrieved.');
  } catch(error) { next(error); }
}
