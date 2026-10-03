import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_URL: z.string().url(),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().regex(/^[A-Za-z0-9_]+$/).min(1),
  JWT_SECRET: z.string().min(32),
  IP_SALT: z.string().min(1),
  TRUST_PROXY: z.union([z.coerce.number().int().min(0), z.enum(['loopback', 'linklocal', 'uniquelocal'])]).default(0),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(1)
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
