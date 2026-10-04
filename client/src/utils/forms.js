const optionalNumber = (value) =>
  value === "" || value == null ? undefined : Number(value);
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
