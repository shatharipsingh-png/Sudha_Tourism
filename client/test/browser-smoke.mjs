// Browser tests use live GET APIs and intercept form submissions. No database writes.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
});
const origin = process.env.VERIFY_URL || "http://localhost:5173";
let checks = 0;
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const ds = (
    await (await page.request.get(origin + "/api/destinations")).json()
  ).data;
  const ps = (
    await (await page.request.get(origin + "/api/packages?limit=24")).json()
  ).data.items;
  assert.ok(ds?.length && ps?.length);
  const d = ds[0];
  const p = (
    await (
      await page.request.get(origin + "/api/packages/" + ps[0].slug)
    ).json()
  ).data;
  async function go(path, title) {
    await page.goto(origin + path, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await page.waitForTimeout(80);
  }
  async function trap(selector, times = 18) {
    for (const key of ["Tab", "Shift+Tab"])
      for (let i = 0; i < times; i++) {
        await page.keyboard.press(key);
        assert.ok(
          await page.evaluate(
            (selector) =>
              document.querySelector(selector).contains(document.activeElement),
            selector,
          ),
        );
      }
  }
  await go("/", "Discover North India.");
  await page
    .locator("#planner-destination option")
    .nth(1)
    .waitFor({ state: "attached" });
  assert.equal(
    await page.locator("img").first().getAttribute("loading"),
    "eager",
  );
  await page.selectOption("#planner-category", "family");
  await page.selectOption("#planner-duration", "medium");
  await page.getByRole("button", { name: "Find a journey" }).click();
  await page.waitForURL(/category=family&duration=medium/);
  await page.locator("#package-results-heading").waitFor();
  assert.equal(await page.locator("#filter-duration").inputValue(), "medium");
  checks++;
  await go("/destinations", "Explore North India");
  await page.getByRole("button", { name: d.region, exact: true }).click();
  assert.equal(
    await page.locator('main a[href^="/destinations/"]').count(),
    ds.filter((item) => item.region === d.region).length,
  );
  await page.getByRole("button", { name: "All", exact: true }).click();
  assert.equal(
    await page.locator('main a[href^="/destinations/"]').count(),
    ds.length,
  );
  checks++;
  await go("/destinations/" + d.slug, d.name);
  await page
    .getByRole("button", { name: "Plan Your Trip", exact: true })
    .nth(1)
    .click();
  await page.locator("#enquiry-destination").waitFor({ state: "visible" });
  await page.waitForFunction(
    () => !document.getElementById("enquiry-destination").disabled,
  );
  assert.equal(
    await page.locator("#enquiry-destination").inputValue(),
    String(d.id),
  );
  await page.keyboard.press("Escape");
  checks++;
  await go("/packages?limit=2", "Journeys Designed Around North India");
  await page.locator("#package-results-heading").waitFor();
  const first = await page.locator("main article h3").allTextContents();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForURL(/page=2/);
  await page.getByText(/^Page 2 of /).waitFor();
  await page.waitForFunction(
    () =>
      document.activeElement ===
      document.getElementById("package-results-heading"),
  );
  assert.notDeepEqual(
    await page.locator("main article h3").allTextContents(),
    first,
  );
  assert.equal(new URL(page.url()).searchParams.get("limit"), "2");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByText(/^Page 1 of /).waitFor();
  assert.equal(new URL(page.url()).searchParams.has("page"), false);
  checks++;
  await page.locator("#filter-destination").selectOption(d.slug);
  await page.locator("#package-results-heading").waitFor();
  await page.getByRole("button", { name: "Cultural", exact: true }).click();
  await page.locator("#package-results-heading").waitFor();
  assert.equal(new URL(page.url()).searchParams.get("category"), "cultural");
  await page.goBack();
  await page.locator("#package-results-heading").waitFor();
  assert.equal(new URL(page.url()).searchParams.has("category"), false);
  assert.equal(await page.locator("#filter-destination").inputValue(), d.slug);
  await page.goForward();
  await page.locator("#package-results-heading").waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Cultural", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  checks++;
  await page.locator("#filter-minPrice").fill("40000");
  await page.locator("#filter-maxPrice").fill("100");
  await page.getByText("Maximum price must be at least the minimum.").waitFor();
  await page
    .getByRole("button", { name: "Clear Filters", exact: true })
    .first()
    .click();
  await page.locator("#package-results-heading").waitFor();
  assert.equal(new URL(page.url()).search, "");
  checks++;
  await go("/packages/" + p.slug, p.title);
  const day = page.getByRole("button", { name: /Day 01/ });
  assert.equal(await day.getAttribute("aria-expanded"), "true");
  const panel = page.locator(
    '[id="' + (await day.getAttribute("aria-controls")) + '"]',
  );
  await day.focus();
  await page.keyboard.press("Enter");
  assert.equal(await day.getAttribute("aria-expanded"), "false");
  assert.equal(await panel.isVisible(), false);
  await page.keyboard.press("Space");
  assert.equal(await panel.isVisible(), true);
  checks++;
  const enquiry = page.getByRole("button", {
    name: "Enquire Now",
    exact: true,
  });
  await enquiry.click();
  await page.locator("#enquiry-name").waitFor({ state: "visible" });
  await page.waitForFunction(
    () => !document.getElementById("enquiry-destination").disabled,
  );
  assert.equal(
    await page.locator("#enquiry-destination").inputValue(),
    String(p.destination_id),
  );
  assert.ok(
    await page
      .getByText("Enquiry for " + p.title + ".", { exact: true })
      .count(),
  );
  await page.keyboard.press("Escape");
  assert.ok(await enquiry.evaluate((el) => el === document.activeElement));
  checks++;
  const booking = page.getByRole("button", { name: "Request a Booking" });
  await booking.click();
  await page.locator("#booking-name").waitFor({ state: "visible" });
  assert.equal(
    await page.evaluate(() => document.body.style.overflow),
    "hidden",
  );
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(
      await page
        .locator("dialog[open]")
        .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
      `Booking modal overflow at ${width}px`,
    );
  }
  await trap("dialog[open]");
  await page.keyboard.press("Escape");
  assert.ok(await booking.evaluate((el) => el === document.activeElement));
  checks++;
  let captured;
  await page.route("**/api/leads", async (route) => {
    captured = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { id: 1 } }),
    });
  });
  await booking.click();
  for (const [key, value] of Object.entries({
    name: "Browser Test",
    email: "smoke@example.invalid",
    phone: "+919876543210",
    travel_date: new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .slice(0, 10),
    travelers: "2",
  }))
    await page.locator("#booking-" + key).fill(value);
  await page.locator("#booking-room").selectOption("double");
  await page.getByRole("button", { name: "Send booking request" }).click();
  await page
    .getByRole("heading", { name: "Your booking request has been received." })
    .waitFor();
  assert.equal(captured.type, "booking");
  assert.equal(captured.package_id, p.id);
  assert.equal(captured.details.room_preference, "double");
  assert.equal("destination_id" in captured, false);
  await page.getByRole("button", { name: "Continue exploring" }).click();
  checks++;
  await go("/contact", "Let’s start a conversation.");
  assert.equal(
    await page
      .locator('a[href^="tel:"],a[href^="mailto:"],a[href^="https://wa.me/"]')
      .count(),
    0,
  );
  assert.equal(await page.getByText("PLACEHOLDER", { exact: true }).count(), 0);
  for (const [key, value] of Object.entries({
    name: "Browser Test",
    email: "smoke@example.invalid",
    message: "Please help with planning this test journey.",
  }))
    await page.locator("#contact-" + key).fill(value);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page.getByText("Thank you. Your message has been received.").waitFor();
  assert.equal(captured.type, "contact");
  assert.equal("phone" in captured, false);
  assert.equal(await page.locator("#contact-name").inputValue(), "");
  await page.unroute("**/api/leads");
  checks++;
  await go("/experiences", "Experience North India Your Way");
  await page
    .getByRole("button", { name: "Plan This Experience →" })
    .first()
    .click();
  await page.locator("#enquiry-message").waitFor({ state: "visible" });
  assert.ok(
    (await page.locator("#enquiry-message").inputValue()).includes(
      "experience",
    ),
  );
  await page.keyboard.press("Escape");
  checks++;
  for (const path of [
    "/destinations/missing-trail",
    "/packages/missing-trail",
    "/missing-trail",
  ]) {
    await go(path, "This trail seems to lead somewhere else.");
    assert.equal(await page.title(), "Page not found | Sudha Tourism");
  }
  checks++;
  await page.route("**/api/destinations", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ success: false, message: "Private SQL details" }),
    }),
  );
  await page.goto(origin + "/destinations", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Try again" }).waitFor();
  assert.equal(await page.getByText("Private SQL details").count(), 0);
  await page.unroute("**/api/destinations");
  await page.getByRole("button", { name: "Try again" }).click();
  await page.locator('main a[href^="/destinations/"]').first().waitFor();
  checks++;
  const routes = [
    ["/", "Discover North India."],
    ["/destinations", "Explore North India"],
    ["/destinations/" + d.slug, d.name],
    ["/packages", "Journeys Designed Around North India"],
    ["/packages/" + p.slug, p.title],
    ["/experiences", "Experience North India Your Way"],
    ["/about", "Places connect us. Journeys stay with us."],
    ["/contact", "Let’s start a conversation."],
    ["/privacy", "Privacy"],
    ["/terms", "Terms"],
    ["/cancellation", "Cancellation"],
    ["/missing-trail", "This trail seems to lead somewhere else."],
  ];
  for (const [path, title] of routes) {
    await go(path, title);
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(50);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow at ${width}px on ${path}`,
      );
    }
    assert.equal(await page.locator("main h1").count(), 1);
    assert.equal(
      await page
        .getByText(/Coming Soon|Placeholder Page|TODO UI|Coming in Phase 4/)
        .count(),
      0,
    );
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    assert.ok(
      hrefs.every((href) =>
        /^\/(?:$|destinations(?:\/[^?#]+)?(?:\?.*)?$|packages(?:\/[^?#]+)?(?:\?.*)?$|experiences$|about$|contact$|privacy$|terms$|cancellation$)/.test(
          href,
        ),
      ),
      "Unknown internal route",
    );
    checks++;
  }
  await page.setViewportSize({ width: 375, height: 812 });
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  await trap("#mobile-navigation");
  await page.keyboard.press("Escape");
  assert.ok(await menu.evaluate((el) => el === document.activeElement));
  checks++;
  assert.deepEqual(errors, []);
  console.log(
    `PASS: ${checks} browser behavior groups; 12 routes at four viewport widths. Forms intercepted; no database writes.`,
  );
} finally {
  await browser.close();
}
