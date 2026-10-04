import { z } from 'zod';
import { dbEnv, loadConfig } from './database.js';

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
});
export const env = { ...dbEnv, ...loadConfig(runtimeSchema) };
