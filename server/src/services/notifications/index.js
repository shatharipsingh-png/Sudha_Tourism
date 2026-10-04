import { notificationConfig } from '../../config/notifications.js';
import { pool } from '../../db/pool.js';
import { createEmailChannel } from './email.js';

export function createNotifier({channels = [], enrich = async lead => lead, logger = console} = {}) {
  return {
    enabled: channels.length > 0,
    async leadCreated(lead) {
      if (!['enquiry','booking','contact'].includes(lead.type)) return {status:'ignored'};
      if (!channels.length) return {status:'disabled'};
      try {
        const data = await enrich(lead);
        const results = await Promise.allSettled(channels.map(channel => Promise.resolve().then(() => channel(data))));
        const failed = results.some(result => result.status === 'rejected');
        logger[failed ? 'error' : 'log'](JSON.stringify({event:failed ? 'lead_notification_failed' : 'lead_notification_accepted'}));
        return {status:failed ? 'failed' : 'accepted'};
      } catch {
        logger.error(JSON.stringify({event:'lead_notification_failed'}));
        return {status:'failed'};
      }
    }
  };
}
async function enrich(lead) {
  const result = {...lead};
  if (lead.package_id) {
    const [rows] = await pool.execute('SELECT title FROM packages WHERE id = ?', [lead.package_id]);
    result.package_title = rows[0]?.title;
  }
  if (lead.destination_id) {
    const [rows] = await pool.execute('SELECT name FROM destinations WHERE id = ?', [lead.destination_id]);
    result.destination_name = rows[0]?.name;
  }
  return result;
}
const email = createEmailChannel(notificationConfig);
export const notifications = createNotifier({channels:email ? [email] : [],enrich});
