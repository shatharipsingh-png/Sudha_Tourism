// Build-time configuration is public. Never pass server credentials to Vite.
const localHost = (hostname) =>
  ["localhost", "[::1]", "0.0.0.0"].includes(hostname) ||
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname) ||
  /\.(localhost|local)$/.test(hostname);
function origin(value, key, allowLocal = false) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (
      /[;\s"'<>]/.test(url.hostname) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      !(
        url.protocol === "https:" ||
        (allowLocal && localHost(url.hostname) && url.protocol === "http:")
      ) ||
      (!allowLocal && localHost(url.hostname))
    )
      throw new Error();
    return url.origin;
  } catch {
    throw new Error(
      `${key} must be an exact ${allowLocal ? "HTTP(S)" : "public HTTPS"} origin.`,
    );
  }
}
export function readPublicConfig(values = {}) {
  const allowed = new Set([
    "VITE_SITE_URL",
    "VITE_API_ORIGIN",
    "VITE_SOCIAL_IMAGE",
    "VITE_IMAGE_ORIGINS",
  ]);
  for (const key of Object.keys(values)) {
    if (key.startsWith("VITE_") && !allowed.has(key))
      throw new Error(`Unapproved public configuration field: ${key}`);
  }
  const siteUrl = origin(values.VITE_SITE_URL?.trim(), "VITE_SITE_URL");
  const apiOrigin = origin(
    values.VITE_API_ORIGIN?.trim(),
    "VITE_API_ORIGIN",
    values.DEV === true,
  );
  const imageOrigins = [
    ...new Set(
      (values.VITE_IMAGE_ORIGINS || "https://images.unsplash.com")
        .split(",")
        .map((value) => origin(value.trim(), "VITE_IMAGE_ORIGINS"))
        .filter(Boolean),
    ),
  ];
  const socialImage = values.VITE_SOCIAL_IMAGE?.trim() || "";
  if (
    socialImage &&
    !(/^\/(?!\/)/.test(socialImage) || /^https:\/\//.test(socialImage))
  )
    throw new Error(
      "VITE_SOCIAL_IMAGE must be an HTTPS URL or a site-relative path.",
    );
  if (socialImage.startsWith("https://")) {
    const url = new URL(socialImage);
    if (url.username || url.password || localHost(url.hostname))
      throw new Error(
        "VITE_SOCIAL_IMAGE must be public and contain no credentials.",
      );
  }
  return { siteUrl, apiOrigin, socialImage, imageOrigins };
}
export const publicConfig = readPublicConfig(import.meta.env || {});
export function resolveApiPath(path, apiOrigin = publicConfig.apiOrigin) {
  if (!path.startsWith("/api/") || path.startsWith("//"))
    throw new Error("Use a relative API endpoint.");
  return apiOrigin ? new URL(path, apiOrigin).href : path;
}
export function frontendHeaders(config) {
  // Motion and React use inline style attributes. Script sources remain strict;
  // stylesheets are separately restricted to bundled CSS and Google Fonts.
  const policy = [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self'",
    "script-src-attr 'none'",
    "style-src 'self' https://fonts.googleapis.com",
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' ${config.imageOrigins.join(" ")}`,
    `connect-src 'self'${config.apiOrigin ? ` ${config.apiOrigin}` : ""}`,
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
  return {
    "Content-Security-Policy": policy,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}
export function robotsText(siteUrl) {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ""}`;
}
