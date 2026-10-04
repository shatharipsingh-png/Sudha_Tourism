import { site } from "../config/site.js";
export function absoluteImage(value, origin) {
  if (!value) return undefined;
  try {
    const url = origin ? new URL(value, origin) : new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function seoModel(title, description, options = {}, config = site) {
  if (typeof options === "string") options = { canonical: options };
  const fullTitle = `${title} | ${config.businessName}`;
  let url;
  if (config.canonicalOrigin && options.robots !== "noindex,nofollow") {
    try {
      const candidate = new URL(
        options.canonical || options.path || "/",
        config.canonicalOrigin,
      );
      if (
        candidate.origin === config.canonicalOrigin &&
        !candidate.username &&
        !candidate.password
      ) {
        candidate.search = "";
        candidate.hash = "";
        url = candidate.href;
      }
    } catch {
      /* Invalid canonical is omitted. */
    }
  }
  const image =
    absoluteImage(options.image, config.canonicalOrigin) ||
    absoluteImage(config.socialImage, config.canonicalOrigin);
  const meta = {
    description,
    robots: options.robots || "index,follow",
    "og:title": fullTitle,
    "og:description": description,
    "og:type": "website",
    "og:url": url,
    "og:image": image,
    "og:site_name": config.businessName,
    "twitter:card": image ? "summary_large_image" : "summary",
    "twitter:title": fullTitle,
    "twitter:description": description,
    "twitter:image": image,
  };
  const data = [];
  if (url) {
    if (options.path === "/") {
      data.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: config.businessName,
        url,
      });
      data.push({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: config.businessName,
        url,
        ...(image ? { image } : {}),
      });
    }
    if (options.breadcrumbs?.length)
      data.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: options.breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          item: new URL(item.path, config.canonicalOrigin).href,
        })),
      });
    if (options.destination)
      data.push({
        "@context": "https://schema.org",
        "@type": "TouristDestination",
        name: options.destination.name,
        description: options.destination.short_desc,
        url,
        ...(image ? { image } : {}),
      });
    // Travel proposals do not assert offers, ratings or confirmed arrangements.
    if (options.trip)
      data.push({
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        name: options.trip.title,
        description: options.trip.short_desc,
        url,
        ...(image ? { image } : {}),
      });
  }
  return { title: fullTitle, canonical: url, meta, data };
}
export const serializeJsonLd = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
