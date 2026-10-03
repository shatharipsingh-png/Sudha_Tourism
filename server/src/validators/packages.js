import { z } from 'zod';

export const packagesQuerySchema = z.object({
  destination: z.string().trim().min(1).max(120).optional(),
  category: z.enum(['family','adventure','honeymoon','spiritual','cultural','wildlife','luxury']).optional(),
  duration: z.enum(['short','medium','long']).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  best_seller: z.enum(['true','false']).optional(),
  featured: z.enum(['true','false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12)
}).superRefine((value, ctx) => {
  if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['maxPrice'], message: 'maxPrice must be greater than or equal to minPrice.' });
  }
});
