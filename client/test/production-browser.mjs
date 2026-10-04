// Mocked APIs: SEO, production CSP, accessibility and safe-error verification.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
const origin = process.env.VERIFY_URL || "http://localhost:5173";
const siteOrigin = process.env.SEO_SITE_URL || "";
const axeSource = process.env.AXE_SOURCE
  ? await readFile(process.env.AXE_SOURCE, "utf8")
  : null;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [],
  violations = [],
  cspViolations = [];
let groups = 0,
  axePages = 0,
  authenticated = false,
  unavailable = false,
  leadFailure = false;
page.on("pageerror", (error) => errors.push(error.message));
await page.exposeFunction("reportCspViolation", (event) =>
  cspViolations.push(event),
);
await page.addInitScript(() => {
  document.addEventListener("securitypolicyviolation", (event) =>
    window.reportCspViolation({
      directive: event.effectiveDirective,
      blocked: event.blockedURI,
    }),
  );
});
const pkg = {
  id: 2,
  slug: "test-trip",
  title: "Test Trip",
  destination_id: 1,
  route: "City — Hills",
  category: "family",
  duration_days: 2,
  price: 15000,
  rating: null,
  image: "https://images.unsplash.com/test-trip",
  gallery: ["https://images.unsplash.com/test-gallery"],
  short_desc: "Explore a test itinerary.",
  highlights: ["Architecture"],
  itinerary: [
    {
      day: 1,
      title: "Arrival",
      description: "Explore the city.",
      activities: ["Walk"],
    },
    { day: 2, title: "Return", description: "Return by rail.", activities: [] },
  ],
  inclusions: ["Stay"],
  exclusions: ["Flights"],
  info: { important: ["Confirm details"], tips: ["Water"] },
  best_seller: false,
  featured: true,
  status: "published",
  destination: { name: "Test Destination", slug: "test-destination" },
  destination_name: "Test Destination",
  destination_slug: "test-destination",
  related: [],
};
const dest = {
  id: 1,
  slug: "test-destination",
  name: "Test Destination",
  region: "North",
  image: "https://images.unsplash.com/test-destination",
  short_desc: "Explore test landscapes.",
  description: "A destination for isolated testing.",
  why_visit: ["Architecture"],
  top_places: [{ name: "Fort", description: "Explore architecture" }],
  travel_info: { best_time: "Winter", how_to_reach: "Rail", tips: ["Water"] },
  packages: [pkg],
};
const experience = {
  id: 3,
  name: "Test Experience",
  slug: "test-experience",
  image: "https://images.unsplash.com/test-experience",
  description: "A walking experience.",
  examples: ["Village walk"],
  sort: 0,
};
const lead = {
  id: 4,
  type: "enquiry",
  name: "Test Traveler",
  email: "traveler@example.test",
  phone: "1234567890",
  status: "new",
  created_at: "2026-01-01T00:00:00Z",
  message: "Please send an itinerary.",
  details: { budget: "15000", travel_type: "family" },
};
const records = {
  destinations: [dest],
  packages: [pkg],
  experiences: [experience],
};
await context.route("**/api/**", async (route) => {
  const url = new URL(route.request().url()),
    path = url.pathname,
    method = route.request().method();
  if (!path.startsWith("/api/")) return route.continue();
  const respond = (status, data, message = "OK") =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ success: status < 400, data, message }),
    });
  if (unavailable) return respond(503, null, "INTERNAL_SQL_SENTINEL");
  if (path === "/api/leads")
    return leadFailure
      ? respond(429, null, "INTERNAL_SQL_SENTINEL")
      : respond(200, { id: 5 });
  if (path === "/api/destinations") return respond(200, [dest]);
  if (path === "/api/destinations/test-destination") return respond(200, dest);
  if (path === "/api/packages")
    return respond(200, {
      items: [pkg],
      total: 1,
      page: 1,
      limit: 6,
      totalPages: 1,
    });
  if (path === "/api/packages/test-trip") return respond(200, pkg);
  if (path === "/api/experiences") return respond(200, [experience]);
  if (path === "/api/admin/login") {
    authenticated = true;
    return respond(200, { id: 1, email: "admin@example.test" });
  }
  if (path.startsWith("/api/admin/")) {
    if (!authenticated) return respond(401, null, "Unauthorized.");
    if (path === "/api/admin/me")
      return respond(200, { id: 1, email: "admin@example.test" });
    if (path === "/api/admin/logout") {
      authenticated = false;
      return respond(200, null);
    }
    if (path === "/api/admin/stats")
      return respond(200, {
        totalLeads: 1,
        newLeads: 1,
        contactedLeads: 0,
        closedLeads: 0,
        totalDestinations: 1,
        totalPackages: 1,
        publishedPackages: 1,
        totalExperiences: 1,
        leadsByType: { enquiry: 1, booking: 0, contact: 0, newsletter: 0 },
        recentLeads: [lead],
      });
    if (path === "/api/admin/leads")
      return respond(200, {
        items: [lead],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    if (path === "/api/admin/leads/4") return respond(200, lead);
    const [kind, id] = path.replace("/api/admin/", "").split("/");
    if (records[kind])
      return respond(
        200,
        id
          ? records[kind].find((row) => String(row.id) === id)
          : {
              items: records[kind],
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
            },
      );
  }
  return respond(404, null, "Not found.");
});
await context.route("https://images.unsplash.com/**", (route) =>
  route.fulfill({
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#35483d"/></svg>',
  }),
);
await context.route("https://fonts.googleapis.com/**", (route) =>
  route.fulfill({ contentType: "text/css", body: "" }),
);
const check = async (name, run) => {
  await run();
  groups++;
  console.log(`PASS ${name}`);
};
const go = async (path, title) => {
  await page.goto(origin + path, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: title, exact: true }).waitFor();
  await page.waitForTimeout(100);
};
const audit = async (name) => {
  if (!axeSource) return;
  await page.evaluate(axeSource);
  // Audit computed styles without axe's extra cross-origin stylesheet XHR.
  // The external font CSS is an empty fixture; application CSS is same-origin.
  const result = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      preload: false,
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
      },
    });
    return result.violations.map((item) => ({
      id: item.id,
      impact: item.impact,
      targets: item.nodes.map((node) => node.target),
      help: item.help,
    }));
  });
  axePages++;
  violations.push(...result.map((item) => ({ page: name, ...item })));
};
try {
  const requests = [];
  page.on("request", (req) => requests.push(req.url()));
  await check(
    "public startup excludes admin bundle and reserves eager hero",
    async () => {
      const response = await page.goto(origin + "/", {
        waitUntil: "domcontentloaded",
      });
      await page
        .getByRole("heading", { name: "Discover North India.", exact: true })
        .waitFor();
      await page.waitForTimeout(100);
      assert.ok(!requests.some((url) => /\/assets\/Admin-/.test(url)));
      assert.equal(
        await page.locator("main img").first().getAttribute("loading"),
        "eager",
      );
      const hero = await page
        .locator("main img")
        .first()
        .evaluate((el) => ({
          fit: getComputedStyle(el).objectFit,
          height: el.getBoundingClientRect().height,
        }));
      assert.equal(hero.fit, "cover");
      assert.ok(hero.height > 0);
      if (process.env.EXPECT_CSP === "true")
        assert.ok(
          response
            .headers()
            ["content-security-policy"]?.includes("script-src 'self'"),
        );
    },
  );
  await check(
    "all public metadata is unique, canonical and never stale",
    async () => {
      const routes = [
        ["/", "Discover North India."],
        ["/destinations", "Explore North India"],
        ["/destinations/test-destination", "Test Destination"],
        ["/packages", "Journeys Designed Around North India"],
        ["/packages/test-trip", "Test Trip"],
        ["/experiences", "Experience North India Your Way"],
        ["/about", "Places connect us. Journeys stay with us."],
        ["/contact", "Let’s start a conversation."],
        ["/privacy", "Privacy"],
        ["/terms", "Terms"],
        ["/cancellation", "Cancellation"],
      ];
      const titles = new Set(),
        descriptions = new Set();
      for (const [path, title] of routes) {
        await go(path, title);
        const meta = await page.evaluate(() => ({
          title: document.title,
          description: document.querySelector("meta[name=description]")
            ?.content,
          canonical: document.querySelector("link[rel=canonical]")?.href,
          og: document.querySelector('meta[property="og:title"]')?.content,
          robots: document.querySelector("meta[name=robots]")?.content,
        }));
        assert.ok(meta.description);
        assert.equal(meta.og, meta.title);
        assert.equal(meta.robots, "index,follow");
        assert.ok(!titles.has(meta.title));
        assert.ok(!descriptions.has(meta.description));
        titles.add(meta.title);
        descriptions.add(meta.description);
        if (siteOrigin) assert.equal(meta.canonical, siteOrigin + path);
        else assert.equal(meta.canonical, undefined);
        await audit(path);
      }
    },
  );
  await check(
    "detail metadata uses current fetched image and safe entity data",
    async () => {
      await go("/packages/test-trip", "Test Trip");
      assert.equal(
        await page.locator('meta[property="og:image"]').getAttribute("content"),
        pkg.image,
      );
      if (siteOrigin) {
        const data = await page.locator("script[data-sudha-seo]").textContent();
        const parsed = JSON.parse(data);
        assert.ok(parsed.some((item) => item["@type"] === "TouristTrip"));
        assert.ok(!data.includes("priceCurrency"));
      }
      await page
        .getByRole("link", { name: "Destinations", exact: true })
        .first()
        .click();
      await page
        .getByRole("heading", { name: "Explore North India", exact: true })
        .waitFor();
      await page.waitForFunction(
        () =>
          !document
            .querySelector('meta[property="og:image"]')
            ?.content.includes("test-trip"),
      );
      assert.equal(await page.locator("script[data-sudha-seo]").count(), 0);
    },
  );
  await check(
    "missing route/detail noindex and clear stale canonical/entities",
    async () => {
      for (const path of [
        "/missing-page",
        "/packages/missing-package",
        "/destinations/missing-destination",
      ]) {
        await go(path, "This trail seems to lead somewhere else.");
        assert.equal(
          await page.locator("meta[name=robots]").getAttribute("content"),
          "noindex,nofollow",
        );
        assert.equal(await page.locator("link[rel=canonical]").count(), 0);
        assert.equal(await page.locator("script[data-sudha-seo]").count(), 0);
        await audit(path);
      }
    },
  );
  await check(
    "newsletter validation, empty honeypot, loading and safe rate-limit error",
    async () => {
      await go("/", "Discover North India.");
      assert.equal(await page.locator("#newsletter-website").inputValue(), "");
      await page
        .getByLabel("Newsletter email address")
        .fill("newsletter@example.test");
      await page.getByLabel("I agree to receive travel emails.").check();
      leadFailure = true;
      await page
        .getByRole("button", { name: "Subscribe to newsletter" })
        .click();
      await page
        .getByText("Please wait a few minutes before trying again.", {
          exact: true,
        })
        .waitFor();
      assert.ok(
        !(await page.locator("body").innerText()).includes(
          "INTERNAL_SQL_SENTINEL",
        ),
      );
      leadFailure = false;
      await page
        .getByRole("button", { name: "Subscribe to newsletter" })
        .click();
      await page
        .getByText("Thank you. Your subscription request has been received.", {
          exact: true,
        })
        .waitFor();
    },
  );
  await check("API unavailability is graceful and retryable", async () => {
    unavailable = true;
    await go("/destinations", "Explore North India");
    await page
      .getByRole("button", { name: "Try again", exact: true })
      .waitFor();
    assert.ok(
      !(await page.locator("body").innerText()).includes(
        "INTERNAL_SQL_SENTINEL",
      ),
    );
    unavailable = false;
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await page
      .getByRole("heading", { name: "Test Destination", exact: true })
      .waitFor();
  });
  await check(
    "admin login/session metadata remains excluded from indexing",
    async () => {
      await go("/admin/login", "Sign in");
      assert.equal(
        await page.locator("meta[name=robots]").getAttribute("content"),
        "noindex,nofollow",
      );
      assert.equal(await page.locator("link[rel=canonical]").count(), 0);
      await audit("/admin/login");
      await page
        .getByLabel("Email", { exact: true })
        .fill("admin@example.test");
      await page
        .getByLabel("Password", { exact: true })
        .fill("MockOnlyPassword9!");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page
        .getByRole("heading", { name: "Dashboard", exact: true })
        .waitFor();
      await audit("/admin");
    },
  );
  await check("admin list/forms and lead drawer accessibility", async () => {
    for (const [kind, id, title] of [
      ["destinations", 1, "destination"],
      ["packages", 2, "package"],
      ["experiences", 3, "experience"],
    ]) {
      await go(`/admin/${kind}`, `${title[0].toUpperCase() + title.slice(1)}s`);
      await page
        .getByRole("link", {
          name: `Edit ${kind === "packages" ? pkg.title : kind === "destinations" ? dest.name : experience.name}`,
        })
        .waitFor();
      await audit(`/admin/${kind}`);
      await go(`/admin/${kind}/new`, `Add ${title}`);
      await page
        .getByLabel(kind === "packages" ? "Title" : "Name", { exact: true })
        .waitFor();
      await audit(`/admin/${kind}/new`);
      await go(`/admin/${kind}/${id}/edit`, `Edit ${title}`);
      await page
        .getByLabel(kind === "packages" ? "Title" : "Name", { exact: true })
        .waitFor();
      await audit(`/admin/${kind}/edit`);
    }
    await go("/admin/leads", "Leads");
    await page.getByRole("button", { name: "View lead Test Traveler" }).click();
    await page.getByRole("heading", { name: "Lead #4" }).waitFor();
    await audit("/admin/leads detail");
    await page.keyboard.press("Escape");
  });
  await check(
    "mobile landmarks, named controls, contrast, drawer and reduced motion",
    async () => {
      await page.setViewportSize({ width: 375, height: 900 });
      await go("/admin/packages/2/edit", "Edit package");
      await page.getByRole("button", { name: "Open admin menu" }).click();
      await page.locator("dialog[open]").waitFor();
      await audit("/admin mobile menu");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);
      assert.equal(
        await page
          .getByRole("button", { name: "Open admin menu" })
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await audit("/admin mobile package editor");
      await go("/packages/test-trip", "Test Trip");
      await page
        .getByRole("button", { name: "Request a Booking", exact: true })
        .click();
      await page.locator("dialog[open]").waitFor();
      await audit("/booking request dialog");
      await page.keyboard.press("Escape");
      assert.ok(
        await page.evaluate(
          () => matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
      );
    },
  );
  await check("no application errors or CSP violations", async () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(cspViolations, []);
  });
  console.log(
    `Production browser tests: ${groups}/${groups} PASS; axe reviewed ${axePages} page/dialog states.`,
  );
  if (violations.length) {
    console.log(JSON.stringify(violations, null, 2));
    throw new Error(
      `Accessibility audit found ${violations.length} violations.`,
    );
  }
  console.log(
    axeSource
      ? "Automated accessibility: zero violations in reviewed states. Formal screen-reader audit remains UNVERIFIED."
      : "Automated axe audit SKIPPED: set AXE_SOURCE; no certification is claimed.",
  );
} finally {
  await browser.close();
}
