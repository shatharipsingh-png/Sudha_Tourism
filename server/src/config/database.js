import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
}

export function parseConfig(schema, values) {
  const result = schema.safeParse(values);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path[0]))];
    throw new Error(`Invalid configuration fields: ${fields.join(', ')}`);
  }
  return result.data;
}

export function loadConfig(schema) {
  try { return parseConfig(schema, process.env); }
  catch (error) {
    // parseConfig constructs this message from schema field names only.
    console.error(error.message);
    process.exit(1);
  }
}

export const databaseSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1).max(64).regex(/^[A-Za-z0-9_]+$/)
});
export const dbEnv = loadConfig(databaseSchema);
