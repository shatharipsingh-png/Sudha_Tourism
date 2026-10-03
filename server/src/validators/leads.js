import { z } from 'zod';

const phone = z.string().trim().regex(/^[+0-9 ()-]{7,20}$/, 'Invalid phone number.');
const email = z.string().trim().email().max(320);
const date = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.').refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'Invalid date.');
const futureDate = date.refine((value) => {
  const today = new Date();
  const candidate = new Date(`${value}T00:00:00Z`);
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return candidate > todayUtc;
}, 'Travel date must be in the future.');
const id = z.coerce.number().int().positive();
const detailsBase = z.object({}).passthrough();

const common = {
  name: z.string().trim().min(1).max(160),
  email,
  phone,
  message: z.string().trim().max(2000).optional(),
  website: z.string().trim().max(500).optional()
};

export const leadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('enquiry'),
    ...common,
    destination_id: id.optional(),
    package_id: id.optional(),
    travel_date: date.optional(),
    travelers: z.coerce.number().int().min(1).max(50).optional(),
    details: detailsBase.extend({
      duration: z.string().trim().max(100).optional(),
      budget: z.string().trim().max(100).optional(),
      travel_type: z.enum(['family','couple','honeymoon','adventure','spiritual','luxury','group','solo','custom']).optional()
    }).optional()
  }),
  z.object({
    type: z.literal('booking'),
    ...common,
    package_id: id,
    travel_date: futureDate,
    travelers: z.coerce.number().int().min(1).max(50),
    details: detailsBase.extend({
      room_preference: z.enum(['single','double','triple','family']).optional()
    }).optional()
  }),
  z.object({
    type: z.literal('contact'),
    ...common,
    phone: phone.optional(),
    message: z.string().trim().min(10).max(2000),
    website: z.string().trim().max(500).optional()
  }),
  z.object({
    type: z.literal('newsletter'),
    email,
    website: z.string().trim().max(500).optional()
  })
]);
