import { z } from 'zod';
import { page, positiveId, slug } from './common.js';

export const imageUrl = z.string().trim().max(1000).url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'Use an HTTP(S) URL.');
export const boolean = z.union([z.boolean(), z.enum(['true', 'false']).transform(value => value === 'true')]);
const text = (max, min = 1) => z.string().trim().min(min).max(max);
export const stringArray = z.array(text(1000)).max(50);
const sort = z.number().int().min(-100000).max(100000);
export const contentSlug = z.string().trim().toLowerCase().transform(value => value.replace(/\s+/g, '-')).pipe(slug);
export const category = z.enum(['family','adventure','honeymoon','spiritual','cultural','wildlife','luxury']);
export const packageStatus = z.enum(['published','draft']);
export const idParams = z.object({ id: positiveId });
export const itinerary = z.array(z.object({
  day: z.number().int().min(1).max(365),
  title: text(220), description: text(10000),
  activities: stringArray
}).strict()).max(365).refine(rows => new Set(rows.map(row => row.day)).size === rows.length, 'Itinerary days must be unique.');

export const destinationSchema = z.object({
  slug: contentSlug.pipe(z.string().max(120)),
  name: text(160), region: text(160), short_desc: text(500),
  description: text(20000), image: imageUrl,
  why_visit: stringArray,
  top_places: z.array(z.object({ name: text(160), description: text(2000), image: imageUrl.optional() }).strict()).max(50),
  travel_info: z.object({ best_time: text(1000), how_to_reach: text(2000), tips: stringArray }).strict(),
  featured: boolean.default(false), sort: sort.default(0)
}).strict();
export const packageSchema = z.object({
  slug: contentSlug, title: text(220), destination_id: positiveId,
  route: text(500), category,
  duration_days: z.number().int().min(1).max(365),
  price: z.number().int().min(0).max(4294967295),
  rating: z.number().min(0).max(5).nullable().default(null),
  image: imageUrl, gallery: z.array(imageUrl).max(50),
  short_desc: text(500), highlights: stringArray, itinerary,
  inclusions: stringArray, exclusions: stringArray,
  info: z.object({ important: stringArray, tips: stringArray }).strict(),
  best_seller: boolean.default(false), featured: boolean.default(false),
  status: packageStatus.default('draft')
}).strict();
export const experienceSchema = z.object({
  slug: contentSlug.pipe(z.string().max(120)),
  name: text(160), image: imageUrl, description: text(20000),
  examples: stringArray, sort: sort.default(0)
}).strict();
function patch(schema) {
  return schema.partial().refine(value => Object.keys(value).length > 0, 'Supply at least one field.');
}
export const destinationPatch = patch(destinationSchema);
export const packagePatch = patch(packageSchema);
export const experiencePatch = patch(experienceSchema);
export const contentQuery = z.object({
  page, limit: z.coerce.number().int().min(1).max(50).default(20)
});
export const adminPackagesQuery = contentQuery.extend({
  destination_id: positiveId.optional(), category: category.optional(), status: packageStatus.optional()
});
