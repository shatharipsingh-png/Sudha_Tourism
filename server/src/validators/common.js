import { z } from 'zod';

export function optionalField(schema) {
  return z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? undefined : value, schema.optional());
}
export const positiveId = z.coerce.number().int().min(1).max(4294967295);
export const slug = z.string().max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug.');
export const slugParams = z.object({ slug });
export const page = z.coerce.number().int().min(1).max(100000).default(1);
