import { z } from "zod";

const csv = () =>
  z
    .union([z.array(z.string()), z.string()])
    .transform((v) =>
      Array.isArray(v)
        ? v.map((s) => s.trim()).filter(Boolean)
        : v
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean)
    )
    .default([]);

export const destinationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().min(10, "Description is required"),
  shortDescription: z.string().min(5, "Short description is required"),
  image: z.string().url("A valid image URL is required"),
  gallery: csv(),
  bestTimeToVisit: z.string().min(2, "Required"),
  attractions: csv(),
  region: z.string().min(2, "Region is required"),
  active: z.coerce.boolean().default(true),
});
export type DestinationInput = z.infer<typeof destinationSchema>;

export const travelTypeEnum = z.enum([
  "Family",
  "Adventure",
  "Honeymoon",
  "Spiritual",
  "Wildlife",
  "Cultural",
  "Luxury",
]);

export const packageSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().min(10, "Description is required"),
  destinationId: z.string().min(1, "Destination is required"),
  durationDays: z.coerce.number().int().min(1),
  durationNights: z.coerce.number().int().min(0),
  price: z.coerce.number().int().min(0),
  discountPrice: z.coerce.number().int().min(0).optional().nullable(),
  image: z.string().url("A valid image URL is required"),
  gallery: csv(),
  travelTypes: z.union([z.array(travelTypeEnum), travelTypeEnum]).transform((v) =>
    Array.isArray(v) ? v : [v]
  ),
  highlights: csv(),
  inclusions: csv(),
  exclusions: csv(),
  active: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
});
export type PackageInput = z.infer<typeof packageSchema>;

export const itinerarySchema = z.object({
  packageId: z.string().min(1),
  day: z.coerce.number().int().min(1),
  title: z.string().min(2, "Title is required"),
  description: z.string().min(5, "Description is required"),
  activities: csv(),
});
export type ItineraryInput = z.infer<typeof itinerarySchema>;

export const experienceSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  category: z.string().min(2, "Category is required"),
  description: z.string().min(10, "Description is required"),
  image: z.string().url("A valid image URL is required"),
  active: z.coerce.boolean().default(true),
});
export type ExperienceInput = z.infer<typeof experienceSchema>;

export const enquiryStatusEnum = z.enum([
  "New",
  "Contacted",
  "FollowUp",
  "Confirmed",
  "Cancelled",
  "Completed",
]);

export const enquirySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().min(7, "A valid phone number is required"),
  packageId: z.string().optional().nullable(),
  travelDate: z.coerce.date({ errorMap: () => ({ message: "Travel date is required" }) }),
  adults: z.coerce.number().int().min(1).default(1),
  children: z.coerce.number().int().min(0).default(0),
  message: z.string().optional(),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const contactStatusEnum = z.enum(["New", "Read", "Responded"]);

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().optional(),
  message: z.string().min(10, "Please enter a longer message"),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("A valid email is required"),
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const blogPostSchema = z.object({
  title: z.string().min(3, "Title is required"),
  slug: z.string().min(3, "Slug is required"),
  excerpt: z.string().min(10, "Excerpt is required"),
  content: z.string().min(20, "Content is required"),
  featuredImage: z.string().url("A valid image URL is required"),
  category: z.string().min(2, "Category is required"),
  author: z.string().min(2, "Author is required"),
  published: z.coerce.boolean().default(false),
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;

export const loginSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(6, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;
