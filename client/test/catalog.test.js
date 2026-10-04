import test from "node:test";
import assert from "node:assert/strict";
import {
  destinationRegions,
  filterDestinations,
  readPackageQuery,
  updatePackageQuery,
  paginationPages,
  experienceEnquiry,
} from "../src/utils/catalog.js";

test("destination regions and filtering use only actual catalog records", () => {
  const items = [
    { id: 1, region: "North" },
    { id: 2, region: "Hills" },
    { id: 3, region: "North" },
  ];
  assert.deepEqual(destinationRegions(items), ["North", "Hills"]);
  assert.deepEqual(
    filterDestinations(items, "North").map((item) => item.id),
    [1, 3],
  );
  assert.equal(filterDestinations(items, "").length, 3);
  assert.equal(filterDestinations(items, "Other").length, 0);
});
test("package filters round-trip URL values and preserve active filters through pagination", () => {
  const search =
    "destination=rajasthan&category=cultural&duration=medium&minPrice=0&maxPrice=40000&featured=true&page=2&limit=2";
  const parsed = readPackageQuery(search);
  assert.deepEqual(parsed.errors, {});
  assert.equal(parsed.page, 2);
  assert.equal(parsed.values.minPrice, "0");
  const next = updatePackageQuery(search, { page: 3 });
  assert.equal(next.get("page"), "3");
  assert.equal(next.get("destination"), "rajasthan");
  assert.equal(next.get("limit"), "2");
  assert.equal(
    updatePackageQuery(next, { duration: "short" }).has("page"),
    false,
  );
  assert.equal(
    updatePackageQuery(search, { destination: "" }).has("destination"),
    false,
  );
});
test("invalid prices, unsupported duration and invalid pagination are rejected before fetching", () => {
  for (const search of [
    "duration=7",
    "minPrice=-1",
    "maxPrice=1.5",
    "minPrice=500&maxPrice=100",
    "page=0",
    "limit=25",
    "category=unsupported",
    "featured=yes",
  ])
    assert.ok(Object.keys(readPackageQuery(search).errors).length, search);
  assert.deepEqual(
    readPackageQuery("duration=long&maxPrice=4294967295").errors,
    {},
  );
});
test("numbered pagination remains compact and includes boundaries", () => {
  assert.deepEqual(paginationPages(1, 2), [1, 2]);
  assert.deepEqual(paginationPages(5, 100), [1, 4, 5, 6, 100]);
  assert.deepEqual(paginationPages(1, 0), []);
});
test("experience enquiry preserves actual name without fabricating package relationships", () => {
  const culture = experienceEnquiry({ slug: "culture", name: "Culture" });
  assert.equal(culture.travelType, "custom");
  assert.ok(culture.message.includes("Culture"));
  assert.equal("packageId" in culture, false);
  assert.equal(
    experienceEnquiry({ slug: "adventure", name: "Adventure" }).travelType,
    "adventure",
  );
});
