import test from "node:test";
import assert from "node:assert/strict";
import {
  readPublicConfig,
  resolveApiPath,
  frontendHeaders,
  robotsText,
} from "../src/config/deployment.js";
import { absoluteImage, seoModel, serializeJsonLd } from "../src/utils/seo.js";
import { scanAssignments } from "../../scripts/check-secrets.mjs";
const config = {
  businessName: "Sudha Tourism",
  canonicalOrigin: "https://www.example.test",
  socialImage: "/sharing.jpg",
};
test("unapproved Vite fields fail without exposing their values", () => {
  assert.throws(
    () => readPublicConfig({ VITE_JWT_SECRET: "SensitiveSentinel123" }),
    (error) =>
      error.message.includes("VITE_JWT_SECRET") &&
      !error.message.includes("SensitiveSentinel123"),
  );
});
test("unset deployment origin emits no invented canonical or sharing URL", () => {
  const result = seoModel(
    "About",
    "About us",
    { path: "/about" },
    { ...config, canonicalOrigin: "", socialImage: "" },
  );
  assert.equal(result.canonical, undefined);
  assert.equal(result.meta["og:url"], undefined);
  assert.equal(result.meta["og:image"], undefined);
  assert.deepEqual(result.data, []);
});
test("canonical origin rejects local, mixed-content and credential-bearing URLs", () => {
  for (const value of [
    "http://www.example.test",
    "https://localhost",
    "https://127.0.0.1",
    "https://user:pass@example.test",
    "https://example.test/path",
    "https://example.test?key=value",
  ])
    assert.throws(() => readPublicConfig({ VITE_SITE_URL: value }));
});
test("public origin normalization has no path or trailing slash", () =>
  assert.equal(
    readPublicConfig({ VITE_SITE_URL: "https://www.example.test/" }).siteUrl,
    "https://www.example.test",
  ));
test("API origin remains optional and relative by default", () =>
  assert.equal(resolveApiPath("/api/admin/me", ""), "/api/admin/me"));
test("configured API origin resolves only controlled API paths", () => {
  assert.equal(
    resolveApiPath("/api/admin/me", "https://api.example.test"),
    "https://api.example.test/api/admin/me",
  );
  assert.throws(() =>
    resolveApiPath("https://attacker.test/api/me", "https://api.example.test"),
  );
});
test("HTTP API only permitted for explicit local development", () => {
  assert.throws(() =>
    readPublicConfig({ VITE_API_ORIGIN: "http://api.example.test" }),
  );
  assert.equal(
    readPublicConfig({ DEV: true, VITE_API_ORIGIN: "http://localhost:5000" })
      .apiOrigin,
    "http://localhost:5000",
  );
});
test("image CSP origins cannot introduce wildcards or directives", () => {
  for (const value of [
    "*",
    "https://example.test; script-src *",
    "data:",
    "http://images.example.test",
  ])
    assert.throws(() => readPublicConfig({ VITE_IMAGE_ORIGINS: value }));
});
test("frontend policy restricts scripts and explicitly supports fonts, API and approved images", () => {
  const headers = frontendHeaders(
    readPublicConfig({
      VITE_API_ORIGIN: "https://api.example.test",
      VITE_IMAGE_ORIGINS: "https://images.example.test",
    }),
  );
  const policy = headers["Content-Security-Policy"];
  assert.ok(policy.includes("script-src 'self'"));
  assert.ok(policy.includes("https://api.example.test"));
  assert.ok(policy.includes("https://images.example.test"));
  assert.ok(policy.includes("https://fonts.gstatic.com"));
  assert.ok(!policy.includes("unsafe-eval"));
  assert.ok(!policy.includes("*"));
});
test("robots discourages exact admin prefix without blocking frontend assets", () => {
  const result = robotsText("https://www.example.test");
  assert.ok(result.includes("Disallow: /admin\n"));
  assert.ok(result.includes("Sitemap: https://www.example.test/sitemap.xml"));
  assert.ok(!robotsText("").includes("Sitemap:"));
  assert.ok(!result.includes("Disallow: /assets"));
});
test("canonical URLs remove query/hash and cannot cross configured origin", () => {
  assert.equal(
    seoModel("Packages", "Trips", { path: "/packages?page=2#results" }, config)
      .canonical,
    "https://www.example.test/packages",
  );
  assert.equal(
    seoModel("About", "About", { canonical: "https://attacker.test" }, config)
      .canonical,
    undefined,
  );
});
test("detail social images take priority over approved fallback", () => {
  const result = seoModel(
    "Jaipur",
    "Heritage",
    {
      path: "/destinations/jaipur",
      image: "https://images.example.test/jaipur.jpg",
    },
    config,
  );
  assert.equal(
    result.meta["og:image"],
    "https://images.example.test/jaipur.jpg",
  );
  assert.equal(result.meta["twitter:card"], "summary_large_image");
});
test("invalid or missing detail image uses configured safe fallback", () => {
  assert.equal(
    seoModel("Trip", "Trip", { image: "javascript:alert(1)" }, config).meta[
      "og:image"
    ],
    "https://www.example.test/sharing.jpg",
  );
  assert.equal(absoluteImage("/relative.jpg", ""), undefined);
});
test("no approved social image omits image and selects basic summary", () => {
  const result = seoModel("Trip", "Trip", {}, { ...config, socialImage: "" });
  assert.equal(result.meta["twitter:card"], "summary");
  assert.equal(result.meta["twitter:image"], undefined);
});
test("missing/error pages omit canonical and structured entities", () => {
  const result = seoModel(
    "Not found",
    "Missing",
    {
      path: "/missing",
      robots: "noindex,nofollow",
      trip: { title: "Missing" },
    },
    config,
  );
  assert.equal(result.canonical, undefined);
  assert.deepEqual(result.data, []);
});
test("home structured data asserts only available business name and URL", () => {
  const result = seoModel("Home", "Travel", { path: "/" }, config);
  assert.deepEqual(
    result.data.map((item) => item["@type"]),
    ["WebSite", "Organization"],
  );
  assert.ok(!JSON.stringify(result.data).includes("telephone"));
  assert.ok(!JSON.stringify(result.data).includes("address"));
});
test("package structured data does not fabricate prices, ratings or availability", () => {
  const result = seoModel(
    "Trip",
    "A trip",
    { path: "/packages/trip", trip: { title: "Trip", short_desc: "A trip" } },
    config,
  );
  assert.equal(result.data[0]["@type"], "TouristTrip");
  for (const key of [
    "offers",
    "priceCurrency",
    "aggregateRating",
    "availability",
  ])
    assert.ok(!JSON.stringify(result.data).includes(key));
});
test("destination breadcrumbs contain ordered canonical public links", () => {
  const result = seoModel(
    "Jaipur",
    "Heritage",
    {
      path: "/destinations/jaipur",
      destination: { name: "Jaipur", short_desc: "Heritage" },
      breadcrumbs: [
        { label: "Home", path: "/" },
        { label: "Jaipur", path: "/destinations/jaipur" },
      ],
    },
    config,
  );
  assert.equal(result.data[0].itemListElement[1].position, 2);
  assert.equal(
    result.data[0].itemListElement[1].item,
    "https://www.example.test/destinations/jaipur",
  );
  assert.equal(result.data[1]["@type"], "TouristDestination");
});
test("JSON-LD escapes markup and preserves content through JSON parsing", () => {
  const value = { name: "</script><script>alert(1)</script>&\u2028" };
  const result = serializeJsonLd(value);
  assert.ok(!result.includes("</script>"));
  assert.deepEqual(JSON.parse(result), value);
});
test("secret scanning reports variable/file without printing credential value", () => {
  const finding = scanAssignments(
    "server/.env.example",
    "DB_PASSWORD=SensitiveSentinel123",
  );
  assert.equal(finding[0].variable, "DB_PASSWORD");
  assert.ok(!JSON.stringify(finding).includes("SensitiveSentinel123"));
});
test("secret scanning distinguishes placeholders and isolated test fixtures", () => {
  assert.deepEqual(
    scanAssignments(
      "server/.env.example",
      "JWT_SECRET=\nSMTP_PASSWORD=<replace me>",
    ),
    [],
  );
  assert.equal(
    scanAssignments("server/test/api.test.js", "password: 'MockPassword9!'")[0]
      .classification,
    "SAFE TEST FIXTURE",
  );
});
