import { z } from 'zod';
import { page, slug, optionalField } from './common.js';

export const packagesQuerySchema = z.object({
  destination: optionalField(slug.max(120)),
  category: z.enum(['family','adventure','honeymoon','spiritual','cultural','wildlife','luxury']).optional(),
  duration: z.enum(['short','medium','long']).optional(),
  minPrice: optionalField(z.coerce.number().int().min(0).max(4294967295)),
  maxPrice: optionalField(z.coerce.number().int().min(0).max(4294967295)),
  best_seller: z.enum(['true','false']).optional(),
  featured: z.enum(['true','false']).optional(),
  page,
  limit: z.coerce.number().int().min(1).max(24).default(12)
}).superRefine((value, ctx) => {
  if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['maxPrice'], message: 'maxPrice must be greater than or equal to minPrice.' });
  }
});
