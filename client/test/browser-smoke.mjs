// Read-only browser checks. Start the API and Vite first; no leads are submitted.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const origin = process.env.VERIFY_URL || "http://localhost:5173";
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Discover North India." }).waitFor();
  await page.locator("#planner-destination option").nth(1).waitFor({ state: "attached" });
  await page.locator('article a[href^="/packages/"]').first().waitFor();
  assert.equal(await page.locator("img").first().getAttribute("loading"), "eager");

  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
  }
  await page.selectOption("#planner-category", "family");
  await page.selectOption("#planner-duration", "medium");
  await page.getByRole("button", { name: "Find a journey" }).click();
  await page.waitForURL(/\/packages\?category=family&duration=medium/);
  await page.getByRole("heading", { name: "Packages", exact: true }).waitFor();
  assert.equal(await page.title(), "Packages | Sudha Tourism");

  await page.setViewportSize({ width: 375, height: 812 });
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  assert.equal(await trigger.getAttribute("aria-expanded"), "true");
  assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
  for (const key of ["Tab", "Shift+Tab"]) {
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press(key);
      assert.ok(await page.evaluate(() => document.querySelector("#mobile-navigation").contains(document.activeElement)));
    }
  }
  await page.keyboard.press("Escape");
  assert.ok(await trigger.evaluate(element => element === document.activeElement));
  assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  await trigger.click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Home", exact: true }).click();
  await page.getByRole("heading", { name: "Discover North India." }).waitFor();

  const plan = page.getByRole("button", { name: "Plan Your Trip", exact: true }).first();
  await plan.click();
  await page.locator("#enquiry-name").waitFor({ state: "visible" });
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => document.querySelector("dialog[open]").contains(document.activeElement)));
  }
  await page.keyboard.press("Escape");
  assert.ok(await plan.evaluate(element => element === document.activeElement));

  await page.route("**/api/destinations", route => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ success: false, message: "Private database details" }) }));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Try again" }).waitFor();
  assert.equal(await page.getByText("Private database details").count(), 0);
  await page.unroute("**/api/destinations");
  await page.getByRole("button", { name: "Try again" }).click();
  await page.locator('main a[href^="/destinations/"]').first().waitFor();

  await page.goto(`${origin}/missing-trail`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "This trail seems to lead somewhere else." }).waitFor();
  assert.equal(await page.title(), "Page not found | Sudha Tourism");
  assert.deepEqual(errors, []);
  console.log("PASS: API content, four viewport widths, planner, dialog keyboard behavior, error/retry, 404 and SEO. No database records changed.");
} finally {
  await browser.close();
}
