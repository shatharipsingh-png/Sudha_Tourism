// Read-only local catalog audit. Never reads leads/admins or prints credentials.
import { writeFile } from "node:fs/promises";
import { site } from "../client/src/config/site.js";
import {
  destinationData,
  packageData,
  experienceData,
} from "../server/src/db/seed-data.js";
let destinations = destinationData,
  packages = packageData,
  experiences = experienceData;
const live = process.argv.includes("--live");
if (live) {
  const { dbEnv } = await import("../server/src/config/database.js");
  if (
    process.env.NODE_ENV === "production" ||
    !["localhost", "127.0.0.1", "::1"].includes(dbEnv.DB_HOST) ||
    dbEnv.DB_NAME !== "sudha_tourism"
  )
    throw new Error(
      "This audit is restricted to the named local development database.",
    );
  const { pool } = await import("../server/src/db/pool.js");
  try {
    [destinations] = await pool.query(
      "SELECT slug,name,image,top_places FROM destinations ORDER BY slug",
    );
    [packages] = await pool.query(
      "SELECT slug,title,image,gallery,price,status FROM packages ORDER BY slug",
    );
    [experiences] = await pool.query(
      "SELECT slug,name,image FROM experiences ORDER BY slug",
    );
  } finally {
    await pool.end();
  }
}
const rows = [];
const add = (kind, name, section, url) => {
  if (!url) return;
  const temporary = new URL(url).hostname === "images.unsplash.com";
  rows.push(
    `| ${kind} | ${String(name).replaceAll("|", "/")} | ${section} | ${temporary ? "SHOULD REPLACE — temporary Unsplash" : "OWNER APPROVAL UNVERIFIED"} | ${url.replaceAll("|", "%7C")} |`,
  );
};
const parse = (value) =>
  typeof value === "string" ? JSON.parse(value) : value;
for (const item of destinations) {
  add(
    "Destination",
    `${item.name} (${item.slug})`,
    "Main/hero/card",
    item.image,
  );
  for (const place of parse(item.top_places) || [])
    if (place.image)
      add("Destination", item.name, `Place: ${place.name}`, place.image);
}
for (const item of packages) {
  add("Package", `${item.title} (${item.slug})`, "Main/hero/card", item.image);
  for (const [index, url] of (parse(item.gallery) || [item.image]).entries())
    add("Package", item.title, `Gallery ${index + 1}`, url);
}
for (const item of experiences)
  add("Experience", `${item.name} (${item.slug})`, "Card", item.image);
add(
  "Page/section",
  "Home, Destinations, About, Contact",
  "Hero",
  site.heroImage,
);
add("Page/section", "Packages, Experiences", "Hero", site.ctaImage);
add("Page/section", "Home, About", "Below-fold story / CTA", site.ctaImage);
const prices = packages
  .map(
    (item) =>
      `| ${item.title.replaceAll("|", "/")} | ${item.price} | ${item.status || "published (seed default)"} | OWNER VERIFICATION REQUIRED |`,
  )
  .join("\n");
const result = `# Content and imagery audit\n\nSource: ${live ? "actual local MySQL catalog (read-only)" : "repository seed catalog (database not inspected by this invocation)"}. Generated ${new Date().toISOString().slice(0, 10)}. No owner approvals are inferred from a URL or a database row. No images were downloaded or replaced.\n\n## Business content\n\n- **BLOCKS LAUNCH:** confirm the displayed business name; supply the production domain; supply an approved business contact channel; verify the INR/per-person assumption and every package price/itinerary; approve legal policies and images.\n- **SHOULD REPLACE / OPTIONAL:** phone, email, WhatsApp, address and business hours are PLACEHOLDER and omitted until configured; supply only channels actually used. Optional social profiles and business statistics are hidden; they are not required if the owner chooses to omit them.\n- **SHOULD REPLACE:** approve the existing text brand mark or supply an approved logo asset. No fabricated logo is present.\n- **SAFE DEVELOPMENT TEXT:** policy-review notice, booking-request disclaimer, enquiry success copy, unavailable-image fallback, empty-state text and isolated test fixtures. Keep request disclaimers truthful in production.\n- Historical notes in docs/preserved-project-notes.md contain draft suggestions, not production claims. Do not copy unverified statistics or contact facts into site.js.\n\n## Image inventory\n\nAll seed Unsplash images require replacement/approval and correct-location review. CMS manages destination/package/experience URLs; site.js manages shared page images. Top-place images matching the parent are deliberately omitted from the public detail gallery. Source URLs do not establish ownership, accuracy or permanence.\n\n| Kind | Content | Placement | Classification | Current URL source |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}\n\n## Pricing inventory\n\nPresentation is centralized in client/src/config/pricing.js: INR starting prices, per person. The MySQL schema does not store currency/unit. These catalog values are not confirmed business quotes. No currency, rating, offer or availability claim is inserted into structured data.\n\n| Package | Stored integer price | Status | Review |\n| --- | --- | --- | --- |\n${prices}\n\n## Legal and request language\n\n/privacy, /terms and /cancellation are explicitly review-required templates. No compliance certification, registered address, jurisdiction, cancellation percentage or guaranteed refund was supplied. Obtain business/legal approval of data handling/retention/contact procedures and package/cancellation/refund terms before replacing the review notice. Current enquiry/booking/contact forms store requests only; no payment, inventory reservation or confirmed booking is implied.\n`;
const outputIndex = process.argv.indexOf("--output");
if (outputIndex !== -1) {
  const output = process.argv[outputIndex + 1];
  if (output !== "docs/content-audit.md")
    throw new Error("Audit output must be docs/content-audit.md.");
  await writeFile(output, result);
  console.log(
    `Catalog audit written: ${destinations.length} destinations, ${packages.length} packages, ${experiences.length} experiences, ${rows.length} image usages.`,
  );
} else console.log(result);
