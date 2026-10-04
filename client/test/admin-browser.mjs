// Deterministic UI/API-contract tests. Every API request is mocked; no DB writes.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { initialContent } from "../src/admin/content.js";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const base = process.env.CLIENT_URL || "http://localhost:5173";
const image = "https://example.test/photo.jpg";
let authenticated = false,
  expired = false,
  duplicate = false,
  conflict = false,
  captured;
const destination = {
  ...initialContent("destinations"),
  id: 21,
  name: "Test Destination",
  slug: "test-destination",
  region: "North",
  short_desc: "Summary",
  description: "Destination description",
  image,
  travel_info: {
    best_time: "Winter",
    how_to_reach: "Train",
    tips: ["Carry water"],
  },
};
const trip = {
  ...initialContent("packages"),
  id: 31,
  title: "Test Package",
  slug: "test-package",
  destination_id: 21,
  route: "City — Hills",
  image,
  short_desc: "Package summary",
  status: "published",
  itinerary: [
    { day: 1, title: "Arrival", description: "Explore", activities: ["Walk"] },
  ],
  gallery: [image],
  info: { important: ["ID required"], tips: ["Water"] },
};
const experience = {
  ...initialContent("experiences"),
  id: 41,
  name: "Test Experience",
  slug: "test-experience",
  image,
  description: "Experience description",
  examples: ["Walk"],
};
const lead = {
  id: 11,
  type: "enquiry",
  name: "Test Traveler",
  email: "traveler@example.test",
  phone: "1234567890",
  destination_name: "Test Destination",
  status: "new",
  created_at: "2026-01-01T12:00:00Z",
  travel_date: "2027-01-01",
  travelers: 2,
  details: {
    duration: "5 days",
    budget: "25000",
    travel_type: "family",
    ip_hash: "PRIVATE_SENTINEL",
  },
  message: "Please send trip details",
  ip_hash: "PRIVATE_SENTINEL",
};
const records = {
  destinations: [destination],
  packages: [trip],
  experiences: [experience],
};
let leadFilters = [];
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await context.route("**/api/**", async (route) => {
  const url = new URL(route.request().url());
  const path = url.pathname;
  const method = route.request().method();
  if (!path.startsWith("/api/")) return route.continue();
  const respond = (status, data, message = "OK") =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ success: status < 400, data, message }),
    });
  if (path === "/api/destinations") return respond(200, records.destinations);
  if (!path.startsWith("/api/admin/")) return respond(200, []);
  const endpoint = path.replace("/api/admin/", "");
  if (endpoint === "login") {
    const body = route.request().postDataJSON();
    if (body.email === "invalid@example.test")
      return respond(401, null, "Invalid email or password");
    authenticated = true;
    expired = false;
    return respond(200, { id: 1, email: body.email });
  }
  if (!authenticated || expired) return respond(401, null, "Unauthorized.");
  if (endpoint === "me")
    return respond(200, { id: 1, email: "admin@example.test" });
  if (endpoint === "logout") {
    authenticated = false;
    return respond(200, null);
  }
  if (endpoint === "stats")
    return respond(200, {
      totalLeads: 1,
      newLeads: lead.status === "new" ? 1 : 0,
      contactedLeads: lead.status === "contacted" ? 1 : 0,
      closedLeads: lead.status === "closed" ? 1 : 0,
      totalDestinations: records.destinations.length,
      totalPackages: records.packages.length,
      publishedPackages: records.packages.filter(
        (item) => item.status === "published",
      ).length,
      totalExperiences: records.experiences.length,
      leadsByType: { enquiry: 1, booking: 0, contact: 0, newsletter: 0 },
      recentLeads: [
        {
          id: lead.id,
          type: lead.type,
          name: lead.name,
          status: lead.status,
          created_at: lead.created_at,
        },
      ],
    });
  if (endpoint === "leads") {
    leadFilters.push(Object.fromEntries(url.searchParams));
    const currentPage = Number(url.searchParams.get("page") || 1);
    return respond(200, {
      items:
        currentPage === 1
          ? [lead]
          : [{ ...lead, id: 12, name: "Second Page Traveler" }],
      total: 21,
      page: currentPage,
      limit: 20,
      totalPages: 2,
    });
  }
  if (endpoint === "leads/11") {
    if (method === "PATCH") {
      lead.status = route.request().postDataJSON().status;
      return respond(200, { id: 11, status: lead.status });
    }
    return respond(200, lead);
  }
  const [kind, id] = endpoint.split("/");
  if (!records[kind]) return respond(404, null);
  if (method === "GET") {
    if (id)
      return respond(
        200,
        records[kind].find((item) => String(item.id) === id),
      );
    return respond(200, {
      items: records[kind],
      page: Number(url.searchParams.get("page") || 1),
      limit: 20,
      total: records[kind].length,
      totalPages: 1,
    });
  }
  if (method === "DELETE") {
    if (conflict)
      return respond(409, null, "Content is referenced and cannot be deleted.");
    records[kind] = records[kind].filter((item) => String(item.id) !== id);
    return respond(200, null);
  }
  captured = { kind, method, body: route.request().postDataJSON() };
  if (duplicate)
    return respond(
      409,
      null,
      "A record with that unique value already exists.",
    );
  if (method === "POST") {
    const item = { ...captured.body, id: records[kind].length + 100 };
    records[kind].push(item);
    return respond(201, item);
  }
  const index = records[kind].findIndex((item) => String(item.id) === id);
  records[kind][index] = { ...records[kind][index], ...captured.body };
  return respond(200, records[kind][index]);
});
await context.route("https://**", (route) => route.abort());
const fill = (label, value) =>
  page.getByLabel(label, { exact: true }).fill(String(value));
const heading = (label) =>
  page.getByRole("heading", { name: label, exact: true }).waitFor();
const go = async (path) => {
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
};
let groups = 0;
const check = async (name, run) => {
  try {
    await run();
    groups++;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.log(
      "Failed group:",
      name,
      "Browser errors:",
      errors,
      "Visible page:",
      await page.locator("body").innerText(),
    );
    throw error;
  }
};
try {
  await check("protected redirect and intended destination", async () => {
    await go("/admin/packages");
    await heading("Sign in");
    assert.equal(new URL(page.url()).pathname, "/admin/login");
    assert.equal(
      await page.locator('meta[name="robots"]').getAttribute("content"),
      "noindex,nofollow",
    );
  });
  await check("generic login rejection", async () => {
    await fill("Email", "invalid@example.test");
    await fill("Password", "MockOnly9!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Invalid email or password." })
      .waitFor();
    assert.equal(
      await page.getByLabel("Password", { exact: true }).inputValue(),
      "",
    );
  });
  await check("successful cookie session and package list", async () => {
    await fill("Email", "admin@example.test");
    await fill("Password", "MockOnly9!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await heading("Packages");
    await page.getByText("Test Package", { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => localStorage.length + sessionStorage.length),
      0,
    );
    assert.equal(await page.locator("footer").count(), 0);
  });
  await check("dashboard real stats fields", async () => {
    await go("/admin");
    await heading("Dashboard");
    await page.getByRole("heading", { name: "Recent leads" }).waitFor();
    assert.equal(await page.getByText("traveler@example.test").count(), 0);
  });
  await check(
    "lead filters reflected in URL and backend requests",
    async () => {
      await go("/admin/leads");
      await heading("Leads");
      await page.getByLabel("Types", { exact: true }).selectOption("enquiry");
      await page.waitForURL("**/admin/leads?type=enquiry");
      const filtered = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/admin/leads" &&
          url.searchParams.get("status") === "new"
        );
      });
      await page.getByLabel("Statuses", { exact: true }).selectOption("new");
      await filtered;
      await page
        .getByRole("button", { name: "View lead Test Traveler" })
        .waitFor();
      assert.ok(page.url().includes("type=enquiry"));
      assert.equal(leadFilters.at(-1).status, "new");
      await page.getByRole("button", { name: "Clear filters" }).click();
      await page.waitForURL("**/admin/leads");
      assert.equal(new URL(page.url()).search, "");
    },
  );
  await check("lead detail whitelist and status update", async () => {
    await page.getByRole("button", { name: "View lead Test Traveler" }).click();
    await page.getByRole("heading", { name: "Lead #11" }).waitFor();
    await page.getByText("5 days", { exact: true }).waitFor();
    assert.ok(
      !(await page.locator("dialog[open]").textContent()).includes(
        "PRIVATE_SENTINEL",
      ),
    );
    await page.getByLabel("Lead status").selectOption("contacted");
    await page.getByRole("button", { name: "Update status" }).click();
    await page.getByText("Lead status updated.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Close lead detail" }).click();
    await page.waitForFunction(
      () => document.activeElement?.id === "lead-open-11",
    );
    assert.equal(lead.status, "contacted");
  });
  await check("pagination requests next page with active filters", async () => {
    await page.getByLabel("Types", { exact: true }).selectOption("enquiry");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByText("Second Page Traveler", { exact: true }).waitFor();
    assert.equal(leadFilters.at(-1).page, "2");
    assert.equal(leadFilters.at(-1).type, "enquiry");
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await page.getByText("Test Traveler", { exact: true }).waitFor();
  });
  await check(
    "destination create structured payload and manual slug",
    async () => {
      await go("/admin/destinations/new");
      await heading("Add destination");
      await fill("Name", "A New Destination");
      assert.equal(
        await page.getByLabel("Slug", { exact: true }).inputValue(),
        "a-new-destination",
      );
      await fill("Slug", "manual-destination");
      await fill("Name", "Renamed Destination");
      assert.equal(
        await page.getByLabel("Slug", { exact: true }).inputValue(),
        "manual-destination",
      );
      await fill("Region", "North");
      await fill("Short description", "Summary");
      await fill("Description", "Description");
      await fill("Main image URL", image);
      await fill("Best time to visit", "Winter");
      await fill("How to reach", "Train");
      await page
        .getByRole("button", { name: "Add reason", exact: true })
        .click();
      await fill("Reason 1", "Architecture");
      await page
        .getByRole("button", { name: "Add place", exact: true })
        .click();
      await fill("Place 1 name", "Fort");
      await fill("Place 1 description", "Historic");
      await page
        .getByRole("button", { name: "Add travel tip", exact: true })
        .click();
      await fill("Travel tip 1", "Carry water");
      await page
        .getByRole("button", { name: "Create destination", exact: true })
        .click();
      await heading("Destinations");
      assert.deepEqual(captured.body.top_places, [
        { name: "Fort", description: "Historic" },
      ]);
      assert.deepEqual(captured.body.why_visit, ["Architecture"]);
      assert.equal(captured.body.slug, "manual-destination");
    },
  );
  await check(
    "destination edit population and duplicate slug feedback",
    async () => {
      await go("/admin/destinations/21/edit");
      await page.getByLabel("Name", { exact: true }).waitFor();
      assert.equal(
        await page
          .getByLabel("Best time to visit", { exact: true })
          .inputValue(),
        "Winter",
      );
      duplicate = true;
      await fill("Slug", "taken");
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "This slug is already in use." })
        .waitFor();
      assert.equal(
        await page
          .getByLabel("Slug", { exact: true })
          .getAttribute("aria-invalid"),
        "true",
      );
      duplicate = false;
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await page.getByText("Destination saved.", { exact: true }).waitFor();
    },
  );
  await check("unsaved internal navigation cancel and discard", async () => {
    await fill("Name", "Unsaved");
    await page.getByRole("link", { name: "Back to destinations" }).click();
    await heading("Discard unsaved changes?");
    await page
      .getByRole("button", { name: "Cancel", exact: true })
      .last()
      .click();
    assert.ok(page.url().includes("/edit"));
    await page.getByRole("link", { name: "Back to destinations" }).click();
    await heading("Discard unsaved changes?");
    await page
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    await heading("Destinations");
  });
  await check(
    "confirmation keyboard focus, escape and referenced deletion",
    async () => {
      const button = page.getByRole("button", {
        name: "Delete Test Destination",
        exact: true,
      });
      await button.click();
      await heading("Delete “Test Destination”?");
      const dialog = page.locator("dialog[open]");
      await page.waitForTimeout(80);
      assert.equal(
        await dialog
          .getByRole("button", { name: "Cancel", exact: true })
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await page.keyboard.press("Shift+Tab");
      assert.equal(
        await dialog
          .getByRole("button", { name: "Delete", exact: true })
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(
        await button.evaluate((el) => el === document.activeElement),
        true,
      );
      conflict = true;
      await button.click();
      await page
        .locator("dialog[open]")
        .getByRole("button", { name: "Delete", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "historical leads" })
        .waitFor();
      await page
        .locator("dialog[open]")
        .getByRole("button", { name: "Cancel", exact: true })
        .click();
      assert.equal(
        await button.evaluate((el) => el === document.activeElement),
        true,
      );
      conflict = false;
    },
  );
  await check(
    "package create itinerary, gallery, arrays and draft payload",
    async () => {
      await go("/admin/packages/new");
      await heading("Add package");
      await fill("Title", "New Trip");
      await page.getByLabel("Destination", { exact: true }).selectOption("21");
      await page
        .getByLabel("Category", { exact: true })
        .selectOption("cultural");
      await fill("Short description", "Summary");
      await fill("Main image URL", image);
      await fill("Route", "City — Fort");
      await fill("Price (₹ INR)", 5000);
      await page
        .getByRole("button", { name: "Add image", exact: true })
        .click();
      await fill("Image 1", image);
      for (const [add, label, value] of [
        ["Add highlight", "Highlight 1", "Culture"],
        ["Add inclusion", "Inclusion 1", "Stay"],
        ["Add exclusion", "Exclusion 1", "Flight"],
        ["Add important item", "Important item 1", "ID"],
        ["Add travel tip", "Travel tip 1", "Water"],
      ]) {
        await page.getByRole("button", { name: add, exact: true }).click();
        await fill(label, value);
      }
      await page.getByRole("button", { name: "Add day", exact: true }).click();
      await fill("Day 1 title", "Arrival");
      await fill("Day 1 description", "Explore");
      await page
        .getByRole("button", { name: "Add activity", exact: true })
        .click();
      await fill("Activity 1", "Walk");
      await page.getByRole("button", { name: "Add day", exact: true }).click();
      await fill("Day 2 title", "Return");
      await fill("Day 2 description", "Train");
      await page
        .getByRole("button", { name: "Move day 2 up", exact: true })
        .click();
      assert.equal(
        await page.getByLabel("Day 1 title", { exact: true }).inputValue(),
        "Return",
      );
      await page
        .getByRole("button", { name: "Create package", exact: true })
        .click();
      await heading("Packages");
      assert.equal(captured.body.status, "draft");
      assert.equal(captured.body.destination_id, 21);
      assert.equal(captured.body.category, "cultural");
      assert.deepEqual(
        captured.body.itinerary.map((item) => item.day),
        [1, 2],
      );
      assert.deepEqual(captured.body.itinerary[1].activities, ["Walk"]);
      assert.deepEqual(captured.body.info, {
        important: ["ID"],
        tips: ["Water"],
      });
      assert.equal(captured.body.rating, null);
    },
  );
  await check(
    "package edit population, status and delete conflict",
    async () => {
      await go("/admin/packages/31/edit");
      await page.getByLabel("Title", { exact: true }).waitFor();
      assert.equal(
        await page.getByLabel("Image 1", { exact: true }).inputValue(),
        image,
      );
      assert.equal(
        await page.getByLabel("Day 1 title", { exact: true }).inputValue(),
        "Arrival",
      );
      await page.getByLabel("Status", { exact: true }).selectOption("draft");
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await page.getByText("Package saved.", { exact: true }).waitFor();
      assert.equal(captured.body.status, "draft");
      await page.getByRole("link", { name: "Back to packages" }).click();
      await heading("Packages");
      conflict = true;
      await page
        .getByRole("button", { name: "Delete Test Package", exact: true })
        .click();
      await page
        .locator("dialog[open]")
        .getByRole("button", { name: "Delete", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "historical leads" })
        .waitFor();
      await page.keyboard.press("Escape");
      conflict = false;
    },
  );
  await check("experience create and examples editing", async () => {
    await go("/admin/experiences/new");
    await heading("Add experience");
    await fill("Name", "A New Experience");
    await fill("Description", "Explore");
    await fill("Main image URL", image);
    await page
      .getByRole("button", { name: "Add example", exact: true })
      .click();
    await fill("Example 1", "Village visit");
    await page
      .getByRole("button", { name: "Create experience", exact: true })
      .click();
    await heading("Experiences");
    assert.deepEqual(captured.body.examples, ["Village visit"]);
    await go("/admin/experiences/41/edit");
    await page.getByLabel("Example 1", { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("Example 1", { exact: true }).inputValue(),
      "Walk",
    );
    await fill("Example 1", "Guided walk");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page.getByText("Experience saved.", { exact: true }).waitFor();
    assert.equal(captured.body.examples[0], "Guided walk");
  });
  await check("confirmed deletion removes only selected content", async () => {
    await page.getByRole("link", { name: "Back to experiences" }).click();
    await heading("Experiences");
    await page
      .getByRole("button", { name: "Delete A New Experience", exact: true })
      .click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await page.getByText("Experience deleted.", { exact: true }).waitFor();
    assert.equal(records.experiences.length, 1);
  });
  await check("all admin routes responsive at four widths", async () => {
    const routes = [
      ["/admin", "Dashboard"],
      ["/admin/leads", "Leads"],
      ["/admin/destinations", "Destinations"],
      ["/admin/destinations/new", "Add destination"],
      ["/admin/destinations/21/edit", "Edit destination"],
      ["/admin/packages", "Packages"],
      ["/admin/packages/new", "Add package"],
      ["/admin/packages/31/edit", "Edit package"],
      ["/admin/experiences", "Experiences"],
      ["/admin/experiences/new", "Add experience"],
      ["/admin/experiences/41/edit", "Edit experience"],
    ];
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [path, title] of routes) {
        await go(path);
        await heading(title);
        await page.waitForTimeout(70);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${path} overflows at ${width}`,
        );
      }
      if (width < 901) {
        await page.getByRole("button", { name: "Open admin menu" }).click();
        await page.locator("dialog[open]").waitFor();
        assert.equal(
          await page.evaluate(() => document.body.style.overflow),
          "hidden",
        );
        await page.keyboard.press("Escape");
        assert.equal(
          await page
            .getByRole("button", { name: "Open admin menu" })
            .evaluate((el) => el === document.activeElement),
          true,
        );
      }
      await mkdir(".verification", { recursive: true });
      await page.screenshot({
        path: `.verification/admin-${width}.png`,
        fullPage: true,
      });
    }
  });
  await check("lead drawer responsive and keyboard close", async () => {
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await go("/admin/leads");
      await page
        .getByRole("button", { name: "View lead Test Traveler" })
        .click();
      await page.getByRole("heading", { name: "Lead #11" }).waitFor();
      assert.ok(
        await page.evaluate(
          () =>
            document.querySelector("dialog[open]").scrollWidth <= innerWidth,
        ),
      );
      await page.keyboard.press("Escape");
      await page.locator("dialog[open]").waitFor({ state: "hidden" });
    }
  });
  await check("session rejection clears private UI and redirects", async () => {
    await go("/admin/leads");
    await page.getByRole("button", { name: "Refresh leads" }).waitFor();
    expired = true;
    await page.getByRole("button", { name: "Refresh leads" }).click();
    await heading("Sign in");
    await page
      .getByText("Your session ended. Please sign in again.", { exact: true })
      .waitFor();
    assert.equal(
      await page.getByText("Test Traveler", { exact: true }).count(),
      0,
    );
  });
  await check("login and logout after rejected session", async () => {
    await fill("Email", "admin@example.test");
    await fill("Password", "MockOnly9!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await heading("Leads");
    await page
      .getByRole("link", { name: "Logout", exact: true })
      .first()
      .click();
    await page.getByText("You have signed out.", { exact: true }).waitFor();
    await heading("Sign in");
    assert.equal(authenticated, false);
    await fill("Email", "admin@example.test");
    await fill("Password", "MockOnly9!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await heading("Dashboard");
  });
  await check(
    "admin robots metadata cleaned on public navigation",
    async () => {
      await page
        .getByRole("link", { name: "View Website", exact: true })
        .first()
        .click();
      await page.waitForURL(base + "/");
      await page.locator("#main-content").waitFor();
      await page.waitForFunction(
        () =>
          document.querySelector("meta[name=robots]")?.content !==
          "noindex,nofollow",
      );
      assert.notEqual(
        await page
          .locator('meta[name="robots"]')
          .getAttribute("content")
          .catch(() => null),
        "noindex,nofollow",
      );
    },
  );
  await check("login responsive at all widths", async () => {
    authenticated = false;
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await go("/admin/login");
      await heading("Sign in");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
  });
  assert.deepEqual(errors, []);
  console.log(`Admin browser tests: ${groups}/${groups} PASS`);
} finally {
  await browser.close();
}
