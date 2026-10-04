import { pricing } from "../config/pricing.js";
const optionalNumber = (value) =>
  value === "" || value == null ? undefined : Number(value);
export function tomorrowUtc(now = new Date()) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export function bookingPayload(values, packageId) {
  return {
    type: "booking",
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    package_id: Number(packageId),
    travel_date: values.travel_date,
    travelers: Number(values.travelers),
    message: values.message?.trim() || undefined,
    details: values.room_preference
      ? { room_preference: values.room_preference }
      : undefined,
    website: values.website || undefined,
  };
}
export function validateBooking(values, packageId, now = new Date()) {
  const errors = validateEnquiry(values);
  if (!Number.isInteger(Number(packageId)) || Number(packageId) < 1)
    errors.package_id = "Please select a package.";
  if (!values.travelers) errors.travelers = "Enter the number of travelers.";
  const date = new Date(`${values.travel_date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(values.travel_date) ||
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== values.travel_date ||
    values.travel_date <= now.toISOString().slice(0, 10)
  )
    errors.travel_date = "Choose a future travel date (UTC).";
  return errors;
}
export function contactPayload(values) {
  return {
    type: "contact",
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone?.trim() || undefined,
    message: values.message.trim(),
    website: values.website || undefined,
  };
}
export function validateContact(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = "Please enter a valid email address.";
  if (values.phone?.trim() && !/^[+0-9 ()-]{7,20}$/.test(values.phone.trim()))
    errors.phone = "Please enter a valid phone number.";
  if (values.message.trim().length < 10)
    errors.message = "Please enter at least 10 characters.";
  return errors;
}
export function enquiryPayload(values, context = {}) {
  const details = {};
  if (values.travel_type) details.travel_type = values.travel_type;
  if (values.budget?.trim()) details.budget = values.budget.trim();
  return {
    type: "enquiry",
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    destination_id: optionalNumber(
      values.destination_id ?? context.destinationId,
    ),
    package_id: optionalNumber(context.packageId),
    travel_date: values.travel_date || undefined,
    travelers: optionalNumber(values.travelers),
    message: values.message?.trim() || undefined,
    details: Object.keys(details).length ? details : undefined,
    website: values.website || undefined,
  };
}
export function validateEnquiry(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = "Please enter a valid email address.";
  if (!/^[+0-9 ()-]{7,20}$/.test(values.phone.trim()))
    errors.phone = "Please enter a valid phone number.";
  if (
    values.travelers &&
    (!Number.isInteger(Number(values.travelers)) ||
      Number(values.travelers) < 1 ||
      Number(values.travelers) > 50)
  )
    errors.travelers = "Choose between 1 and 50 travelers.";
  return errors;
}
export function whatsappUrl(number, businessName = "your team") {
  if (typeof number !== "string" || !/^\+?[1-9]\d{6,14}$/.test(number))
    return null;
  return `https://wa.me/${number.replace("+", "")}?text=${encodeURIComponent(`Hello ${businessName}, I would like to plan a North India trip.`)}`;
}
export function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  )
    return "Price on enquiry";
  return new Intl.NumberFormat(pricing.locale, {
    style: "currency",
    currency: pricing.currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}
