import nodemailer from 'nodemailer';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
export function leadMessage(lead) {
  const fields = [
    ['Lead type',lead.type],['Name',lead.name],['Email',lead.email],['Phone',lead.phone],
    ['Package',lead.package_title],['Destination',lead.destination_name],
    ['Travel date',lead.travel_date],['Travelers',lead.travelers],['Message',lead.message],
    ['Requirements',lead.details ? JSON.stringify(lead.details) : undefined],['Created',lead.created_at]
  ].filter(([,value]) => value !== undefined && value !== null && value !== '');
  return {
    subject: `Sudha Tourism: new ${lead.type} lead`,
    text: fields.map(([label,value]) => `${label}: ${value}`).join('\n'),
    html: `<h1>New travel lead</h1><dl>${fields.map(([label,value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>`
  };
}
export function createEmailChannel(config, transport) {
  if (!config.SMTP_ENABLED) return null;
  const mailer = transport ?? nodemailer.createTransport({
    host:config.SMTP_HOST, port:config.SMTP_PORT, secure:config.SMTP_SECURE,
    requireTLS: !config.SMTP_SECURE,
    auth:config.SMTP_USER ? {user:config.SMTP_USER,pass:config.SMTP_PASSWORD} : undefined,
    connectionTimeout:10000, greetingTimeout:10000, socketTimeout:15000, dnsTimeout:10000,
    logger:false, debug:false, disableFileAccess:true, disableUrlAccess:true
  });
  return async lead => {
    const result = await mailer.sendMail({from:config.MAIL_FROM,to:config.LEAD_NOTIFICATION_TO,...leadMessage(lead)});
    if (!result.accepted?.length || result.rejected?.length) throw new Error('Notification recipient not accepted.');
  };
}
