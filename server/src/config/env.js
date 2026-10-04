import { z } from 'zod';
import { dbEnv, loadConfig } from './database.js';
import { publicOrigin } from '../utils/publicOrigin.js';

export const runtimeSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_URL: z.string().url().refine((value) => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
  }, 'Use an exact HTTP(S) origin without a trailing slash'),
  JWT_SECRET: z.string().min(32),
  IP_SALT: z.string().min(16),
  TRUST_PROXY: z.union([
    z.enum(['loopback', 'linklocal', 'uniquelocal']),
    z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(10)),
    z.number().int().min(0).max(10)
  ]).default(0)
}).superRefine((value, ctx) => {
  if (value.NODE_ENV !== 'production') return;
  if (!publicOrigin(value.CLIENT_URL)) ctx.addIssue({ code:'custom', path:['CLIENT_URL'], message:'Production requires an exact public HTTPS frontend origin.' });
  for (const key of ['JWT_SECRET','IP_SALT']) {
    if (/placeholder|change.?me|test.only|development|replace.?this/i.test(value[key]) || /^(.)\1+$/.test(value[key])) ctx.addIssue({ code:'custom', path:[key], message:'Use a independently generated production secret.' });
  }
  if (value.JWT_SECRET === value.IP_SALT) ctx.addIssue({ code:'custom',path:['IP_SALT'],message:'Generate independently of JWT_SECRET.' });
});
export const env = { ...dbEnv, ...loadConfig(runtimeSchema) };
