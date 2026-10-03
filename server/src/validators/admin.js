import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(200)
});

export const adminLeadsQuerySchema = z.object({
  type: z.enum(['enquiry','booking','contact','newsletter']).optional(),
  status: z.enum(['new','contacted','closed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const leadStatusSchema = z.object({
  status: z.enum(['new','contacted','closed'])
});
