import { z } from 'zod';
export const adminCreationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(12).max(72)
    .refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password exceeds bcrypt byte limit.')
    .refine(value => /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value), 'Use uppercase, lowercase, number and symbol.')
}).strict();
