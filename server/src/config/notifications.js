import { z } from 'zod';
import { loadConfig } from './database.js';
const blank = schema => z.preprocess(value => value === '' ? undefined : value, schema);
export const notificationSchema = z.object({
  SMTP_ENABLED: z.enum(['true','false']).default('false').transform(value => value === 'true'),
  SMTP_HOST: blank(z.string().min(1).max(253).optional()),
  SMTP_PORT: blank(z.coerce.number().int().min(1).max(65535).default(587)),
  SMTP_SECURE: blank(z.enum(['true','false']).default('false').transform(value => value === 'true')),
  SMTP_USER: blank(z.string().max(320).optional()),
  SMTP_PASSWORD: blank(z.string().optional()),
  LEAD_NOTIFICATION_TO: blank(z.string().email().max(320).optional()),
  MAIL_FROM: blank(z.string().email().max(320).optional())
}).superRefine((value,ctx) => {
  if (!value.SMTP_ENABLED) return;
  for (const key of ['SMTP_HOST','LEAD_NOTIFICATION_TO','MAIL_FROM']) {
    if (!value[key]) ctx.addIssue({code:'custom',path:[key],message:'Required when enabled.'});
  }
  if (Boolean(value.SMTP_USER) !== Boolean(value.SMTP_PASSWORD)) ctx.addIssue({code:'custom',path:['SMTP_USER'],message:'Supply both authentication fields.'});
});
export const notificationConfig = loadConfig(notificationSchema);
