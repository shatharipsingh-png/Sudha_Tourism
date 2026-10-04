import { categories, durations } from "../config/site.js";
export const packageFilterKeys = [
  "destination",
  "category",
  "duration",
  "minPrice",
  "maxPrice",
  "best_seller",
  "featured",
  "page",
  "limit",
];
export function readPackageQuery(search) {
  const params = new URLSearchParams(search);
  const values = Object.fromEntries(
    packageFilterKeys.map((key) => [key, params.get(key) || ""]),
  );
  const errors = {};
  if (
    values.destination &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.destination)
  )
    errors.destination = "Choose a valid destination.";
  if (values.category && !categories.some(([key]) => key === values.category))
    errors.category = "Choose one of the listed travel styles.";
  if (values.duration && !durations.some(([key]) => key === values.duration))
    errors.duration = "Choose one of the listed duration ranges.";
  for (const key of ["minPrice", "maxPrice"])
    if (
      values[key] &&
      (!/^\d+$/.test(values[key]) || Number(values[key]) > 4294967295)
    )
      errors[key] = "Enter a whole rupee amount between 0 and 4,294,967,295.";
  if (
    !errors.minPrice &&
    !errors.maxPrice &&
    values.minPrice &&
    values.maxPrice &&
    Number(values.minPrice) > Number(values.maxPrice)
  )
    errors.maxPrice = "Maximum price must be at least the minimum.";
  for (const key of ["featured", "best_seller"])
    if (values[key] && !["true", "false"].includes(values[key]))
      errors[key] = "This filter is not valid.";
  if (
    values.page &&
    (!/^\d+$/.test(values.page) ||
      Number(values.page) < 1 ||
      Number(values.page) > 100000)
  )
    errors.page = "Choose a valid page.";
  if (
    values.limit &&
    (!/^\d+$/.test(values.limit) ||
      Number(values.limit) < 1 ||
      Number(values.limit) > 24)
  )
    errors.limit = "Page size must be between 1 and 24.";
  const query = new URLSearchParams(
    Object.entries(values).filter(([, value]) => value),
  );
  if (!query.has("limit")) query.set("limit", "6");
  return {
    values,
    errors,
    query: query.toString(),
    page: Number(values.page) || 1,
  };
}
export function updatePackageQuery(search, changes) {
  const query = new URLSearchParams(search);
  for (const [key, value] of Object.entries(changes)) {
    if (!packageFilterKeys.includes(key)) continue;
    if (
      value === "" ||
      value == null ||
      (String(value) === "1" && key === "page")
    )
      query.delete(key);
    else query.set(key, String(value));
  }
  if (
    Object.keys(changes).some(
      (key) => key !== "page" && packageFilterKeys.includes(key),
    )
  )
    query.delete("page");
  return query;
}
export function destinationRegions(items) {
  return [...new Set(items.map((item) => item.region).filter(Boolean))];
}
export function filterDestinations(items, region) {
  return region ? items.filter((item) => item.region === region) : items;
}
export function paginationPages(page, totalPages) {
  return [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((a, b) => a - b);
}
export function experienceEnquiry(experience) {
  return {
    travelType: ["adventure", "spiritual"].includes(experience.slug)
      ? experience.slug
      : "custom",
    message: `I would like to explore the ${experience.name} experience.`,
  };
}
