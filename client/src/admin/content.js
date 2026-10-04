import { categories } from "../config/site.js";
export const labels = {
  destinations: "Destination",
  packages: "Package",
  experiences: "Experience",
};
export const leadTypes = ["enquiry", "booking", "contact", "newsletter"];
export const leadStatuses = ["new", "contacted", "closed"];
export const transitions = {
  new: ["new", "contacted", "closed"],
  contacted: ["contacted", "closed"],
  closed: ["closed", "contacted"],
};
export const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const validImageUrl = (value) => {
  try {
    return (
      ["https:", "http:"].includes(new URL(value).protocol) &&
      value.length <= 1000
    );
  } catch {
    return false;
  }
};
export function moveItem(items, index, direction) {
  const next = index + direction;
  if (index < 0 || index >= items.length || next < 0 || next >= items.length)
    return items;
  const result = [...items];
  [result[index], result[next]] = [result[next], result[index]];
  return result;
}
export function initialContent(kind, record = {}) {
  record ??= {};
  const defaults = {
    destinations: {
      name: "",
      slug: "",
      region: "",
      short_desc: "",
      description: "",
      image: "",
      featured: false,
      sort: 0,
      why_visit: [],
      top_places: [],
      travel_info: { best_time: "", how_to_reach: "", tips: [] },
    },
    packages: {
      title: "",
      slug: "",
      destination_id: "",
      route: "",
      category: "family",
      duration_days: 1,
      price: 0,
      rating: "",
      image: "",
      gallery: [],
      short_desc: "",
      highlights: [],
      itinerary: [],
      inclusions: [],
      exclusions: [],
      info: { important: [], tips: [] },
      best_seller: false,
      featured: false,
      status: "draft",
    },
    experiences: {
      name: "",
      slug: "",
      image: "",
      description: "",
      examples: [],
      sort: 0,
    },
  }[kind];
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [
      key,
      key === "rating"
        ? (record[key] ?? "")
        : typeof fallback === "boolean"
          ? Boolean(record[key] ?? fallback)
          : structuredClone(record[key] ?? fallback),
    ]),
  );
}
export function contentPayload(kind, values) {
  const payload = initialContent(kind, values);
  if (kind === "destinations")
    payload.top_places = payload.top_places.map((place) => ({
      name: place.name,
      description: place.description,
      ...(place.image ? { image: place.image } : {}),
    }));
  if (kind === "packages")
    payload.itinerary = payload.itinerary.map((item) => ({
      ...item,
      day: Number(item.day),
    }));
  for (const key of ["destination_id", "duration_days", "price", "sort"])
    if (Object.hasOwn(payload, key)) payload[key] = Number(payload[key]);
  if (kind === "packages")
    payload.rating =
      values.rating === "" || values.rating === null
        ? null
        : Number(values.rating);
  return payload;
}
export function validateContent(kind, values) {
  const errors = {};
  const required =
    kind === "destinations"
      ? ["name", "slug", "region", "short_desc", "description", "image"]
      : kind === "packages"
        ? ["title", "slug", "destination_id", "route", "short_desc", "image"]
        : ["name", "slug", "image", "description"];
  if (kind === "destinations")
    for (const key of ["best_time", "how_to_reach"])
      if (!values.travel_info[key].trim())
        errors[`travel_info.${key}`] = "This field is required.";
  for (const key of required)
    if (!String(values[key] ?? "").trim())
      errors[key] = "This field is required.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug))
    errors.slug = "Use lowercase letters, numbers and single hyphens.";
  if (!validImageUrl(values.image))
    errors.image = "Enter a valid HTTP or HTTPS image URL.";
  const number = (key, min, max, integer = true, nullable = false) => {
    if (nullable && values[key] === "") return;
    const value = Number(values[key]);
    if (
      String(values[key]).trim() === "" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (integer && !Number.isInteger(value))
    )
      errors[key] =
        `Enter ${integer ? "a whole number" : "a number"} between ${min} and ${max}.`;
  };
  if (kind === "packages") {
    number("price", 0, 4294967295);
    number("duration_days", 1, 365);
    number("destination_id", 1, 4294967295);
    number("rating", 0, 5, false, true);
  } else number("sort", -100000, 100000);
  // Nested feedback uses the same dotted paths as backend validation.
  function scan(value, path) {
    if (Array.isArray(value)) {
      const max = path === "itinerary" ? 365 : 50;
      if (value.length > max) errors[path] = `Use at most ${max} items.`;
      value.forEach((item, index) => {
        const key = `${path}.${index}`;
        if (typeof item === "string") {
          if (!item.trim()) errors[key] = "Enter a value or remove this item.";
          else if (path === "gallery" && !validImageUrl(item))
            errors[key] = "Enter a valid HTTP or HTTPS image URL.";
        } else scan(item, key);
      });
    } else if (value && typeof value === "object")
      Object.entries(value).forEach(([key, item]) =>
        scan(item, path ? `${path}.${key}` : key),
      );
  }
  scan(values, "");
  if (kind === "packages") {
    const days = new Set();
    values.itinerary.forEach((item, index) => {
      if (
        !Number.isInteger(Number(item.day)) ||
        Number(item.day) < 1 ||
        Number(item.day) > 365 ||
        days.has(Number(item.day))
      )
        errors[`itinerary.${index}.day`] =
          "Use a unique day number between 1 and 365.";
      days.add(Number(item.day));
      for (const key of ["title", "description"])
        if (!item[key].trim())
          errors[`itinerary.${index}.${key}`] = "This field is required.";
    });
  }
  if (kind === "destinations")
    values.top_places.forEach((item, index) => {
      for (const key of ["name", "description"])
        if (!item[key].trim())
          errors[`top_places.${index}.${key}`] = "This field is required.";
      if (item.image && !validImageUrl(item.image))
        errors[`top_places.${index}.image`] =
          "Enter a valid HTTP or HTTPS image URL.";
    });
  return errors;
}
export function listQuery(search, kind) {
  const params = new URLSearchParams(search);
  const page = Number(params.get("page") || 1);
  const query = new URLSearchParams({
    page: String(
      Number.isInteger(page) && page > 0 && page <= 100000 ? page : 1,
    ),
    limit: "20",
  });
  const enums =
    kind === "leads"
      ? { type: leadTypes, status: leadStatuses }
      : kind === "packages"
        ? {
            category: categories.map(([key]) => key),
            status: ["draft", "published"],
          }
        : {};
  for (const [key, allowed] of Object.entries(enums))
    if (allowed.includes(params.get(key))) query.set(key, params.get(key));
  if (
    kind === "packages" &&
    /^[1-9]\d*$/.test(params.get("destination_id") ?? "") &&
    Number(params.get("destination_id")) <= 4294967295
  )
    query.set("destination_id", params.get("destination_id"));
  return query;
}
export const displayDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "—";
