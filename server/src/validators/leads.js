import { z } from 'zod';
import { optionalField, positiveId } from './common.js';

const phone = z.string().trim().regex(/^[+0-9 ()-]{7,20}$/, 'Invalid phone number.');
const email = z.string().trim().toLowerCase().email().max(320);
const date = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.').refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, 'Invalid date.');
const futureDate = date.refine((value) => value > new Date().toISOString().slice(0, 10), 'Travel date must be in the future (UTC).');
const message = z.string().trim().max(2000);
const common = {
  name: z.string().trim().min(1).max(160),
  email, phone,
  message: optionalField(message),
  website: optionalField(z.string().trim().max(500))
};
export const leadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('enquiry'), ...common,
    destination_id: optionalField(positiveId),
    package_id: optionalField(positiveId),
    travel_date: optionalField(date),
    travelers: optionalField(z.coerce.number().int().min(1).max(50)),
    details: optionalField(z.object({
      duration: optionalField(z.string().trim().max(100)),
      budget: optionalField(z.string().trim().max(100)),
      travel_type: optionalField(z.enum(['family','couple','honeymoon','adventure','spiritual','luxury','group','solo','custom']))
    }).strict())
  }),
  z.object({
    type: z.literal('booking'), ...common,
    package_id: positiveId,
    travel_date: futureDate,
    travelers: z.coerce.number().int().min(1).max(50),
    details: optionalField(z.object({ room_preference: optionalField(z.enum(['single','double','triple','family'])) }).strict())
  }),
  z.object({ type: z.literal('contact'), ...common, phone: optionalField(phone), message: message.min(10) }),
  z.object({ type: z.literal('newsletter'), email, consent: z.literal(true), website: common.website })
]);
