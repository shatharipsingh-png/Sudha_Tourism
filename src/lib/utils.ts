import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";

/** Merge conditional Tailwind classes without style collisions. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a price using the site's locale/currency (whole rupees, no decimals). */
export function formatCurrency(
  amount: number,
  currency: string = "INR",
  locale: string = "en-IN"
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a single date, e.g. "12 Sep 2026". */
export function formatDate(date: Date | string, locale = "en-IN") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Human-readable slug generator for packages/destinations/blog posts. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const referenceAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

/** Booking-style reference number for enquiries, e.g. "ST-2026-8F3K2Q". */
export function generateReferenceNo() {
  const year = new Date().getFullYear();
  return `ST-${year}-${referenceAlphabet()}`;
}

/** Build a wa.me deep link with a prefilled message. */
export function buildWhatsAppLink(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Effective price to display/charge — discountPrice when set, else price. */
export function effectivePrice(price: number, discountPrice?: number | null) {
  return discountPrice && discountPrice > 0 && discountPrice < price
    ? discountPrice
    : price;
}

export function discountPercent(price: number, discountPrice?: number | null) {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}
