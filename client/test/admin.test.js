import test from "node:test";
import assert from "node:assert/strict";
import {
  contentPayload,
  initialContent,
  listQuery,
  moveItem,
  slugify,
  transitions,
  validImageUrl,
  validateContent,
} from "../src/admin/content.js";
import { categories } from "../src/config/site.js";
import { adminRequest } from "../src/admin/api.js";
const image = "https://example.test/image.jpg";
const destination = {
  ...initialContent("destinations"),
  name: "Rajasthan",
  slug: "rajasthan",
  region: "North India",
  description: "Description",
  short_desc: "Summary",
  image,
  travel_info: { best_time: "Winter", how_to_reach: "Train", tips: ["Water"] },
};
const trip = {
  ...initialContent("packages"),
  title: "Heritage",
  slug: "heritage",
  destination_id: "3",
  route: "Delhi — Jaipur",
  short_desc: "Summary",
  image,
};
test("suggest readable normalized slugs", () =>
  assert.equal(
    slugify("  Rajasthan Heritage & Culture  "),
    "rajasthan-heritage-culture",
  ));
test("normalize accented slug suggestions", () =>
  assert.equal(slugify("Café & Mountains"), "cafe-mountains"));
test("destination defaults match only supported fields", () =>
  assert.deepEqual(
    Object.keys(initialContent("destinations")).sort(),
    Object.keys(destination).sort(),
  ));
test("strip database metadata from destination payload", () =>
  assert.equal(
    contentPayload("destinations", {
      ...destination,
      id: 5,
      created_at: "today",
      password: "secret",
    }).id,
    undefined,
  ));
test("optional place image omitted when empty", () =>
  assert.deepEqual(
    contentPayload("destinations", {
      ...destination,
      top_places: [{ name: "Fort", description: "Historic", image: "" }],
    }).top_places,
    [{ name: "Fort", description: "Historic" }],
  ));
test("destination structured values are cloned for safe editing", () => {
  const value = initialContent("destinations", destination);
  value.travel_info.tips.push("New");
  assert.equal(destination.travel_info.tips.length, 1);
});
test("valid destination has no local validation errors", () =>
  assert.deepEqual(validateContent("destinations", destination), {}));
test("required travel information receives nested feedback", () =>
  assert.ok(
    validateContent("destinations", {
      ...destination,
      travel_info: { best_time: "", how_to_reach: "", tips: [] },
    })["travel_info.best_time"],
  ));
test("invalid place images receive nested feedback", () =>
  assert.ok(
    validateContent("destinations", {
      ...destination,
      top_places: [
        { name: "Fort", description: "Historic", image: "javascript:alert(1)" },
      ],
    })["top_places.0.image"],
  ));
test("package numeric payload and nullable rating", () => {
  const p = contentPayload("packages", trip);
  assert.equal(p.destination_id, 3);
  assert.equal(p.rating, null);
  assert.equal(p.price, 0);
});
test("populate decimal MySQL rating without inventing value", () =>
  assert.equal(
    contentPayload("packages", { ...trip, rating: "4.5" }).rating,
    4.5,
  ));
test("numeric itinerary days converted from input strings", () =>
  assert.equal(
    contentPayload("packages", {
      ...trip,
      itinerary: [
        {
          day: "2",
          title: "Arrival",
          description: "Explore",
          activities: ["Walk"],
        },
      ],
    }).itinerary[0].day,
    2,
  ));
test("draft is the safe creation default", () =>
  assert.equal(initialContent("packages").status, "draft"));
test("new forms accept an absent fetched record", () =>
  assert.equal(initialContent("destinations", null).name, ""));
test("published state retained in edit payload", () =>
  assert.equal(
    contentPayload("packages", { ...trip, status: "published" }).status,
    "published",
  ));
test("negative prices rejected", () =>
  assert.ok(validateContent("packages", { ...trip, price: -1 }).price));
test("fractional price rejected by integer contract", () =>
  assert.ok(validateContent("packages", { ...trip, price: 1.5 }).price));
test("empty price cannot silently become zero", () =>
  assert.ok(validateContent("packages", { ...trip, price: "" }).price));
test("package rating upper bound enforced", () =>
  assert.ok(validateContent("packages", { ...trip, rating: 6 }).rating));
test("duration limited to supported range", () =>
  assert.ok(
    validateContent("packages", { ...trip, duration_days: 366 }).duration_days,
  ));
test("duplicate itinerary days rejected", () =>
  assert.ok(
    validateContent("packages", {
      ...trip,
      itinerary: [
        { day: 1, title: "A", description: "B", activities: [] },
        { day: 1, title: "C", description: "D", activities: [] },
      ],
    })["itinerary.1.day"],
  ));
test("blank repeatable values require removal or editing", () =>
  assert.ok(
    validateContent("packages", { ...trip, highlights: [""] })["highlights.0"],
  ));
test("gallery URL size and protocol enforced", () =>
  assert.ok(
    validateContent("packages", { ...trip, gallery: ["file:///tmp/a"] })[
      "gallery.0"
    ],
  ));
test("gallery maximum enforced", () =>
  assert.ok(
    validateContent("packages", { ...trip, gallery: Array(51).fill(image) })
      .gallery,
  ));
test("experience examples and sort payload", () =>
  assert.deepEqual(
    contentPayload("experiences", {
      name: "Walk",
      slug: "walk",
      image,
      description: "A walk",
      examples: ["A", "B"],
      sort: "2",
      id: 3,
    }),
    {
      name: "Walk",
      slug: "walk",
      image,
      description: "A walk",
      examples: ["A", "B"],
      sort: 2,
    },
  ));
test("sort range enforced", () =>
  assert.ok(
    validateContent("experiences", {
      name: "Walk",
      slug: "walk",
      image,
      description: "Walk",
      examples: [],
      sort: 100001,
    }).sort,
  ));
test("reordering never mutates original", () => {
  const items = ["A", "B", "C"];
  assert.deepEqual(moveItem(items, 1, -1), ["B", "A", "C"]);
  assert.deepEqual(items, ["A", "B", "C"]);
});
test("reordering beyond boundary does nothing", () =>
  assert.deepEqual(moveItem(["A"], 0, -1), ["A"]));
test("safe image URLs reject active or local schemes", () => {
  for (const value of [
    "data:image/svg+xml,a",
    "javascript:alert(1)",
    "file:///a",
    "",
  ])
    assert.equal(validImageUrl(value), false);
  assert.equal(validImageUrl(image), true);
});
test("lead URL query includes only supported filters", () =>
  assert.equal(
    listQuery(
      "?type=booking&status=new&page=2&search=Bob&limit=500",
      "leads",
    ).toString(),
    "page=2&limit=20&type=booking&status=new",
  ));
test("invalid pages normalize to first page", () => {
  for (const page of ["0", "-1", "1.5", "NaN", "100001"])
    assert.equal(listQuery(`?page=${page}`, "leads").get("page"), "1");
});
test("package category query uses shared backend categories", () => {
  for (const [key] of categories)
    assert.equal(
      listQuery(`?category=${key}`, "packages").get("category"),
      key,
    );
  assert.equal(
    listQuery("?category=unknown&status=archived", "packages").has("category"),
    false,
  );
});
test("lead transitions prevent reopening as new", () => {
  assert.deepEqual(transitions.closed, ["closed", "contacted"]);
  assert.ok(!transitions.contacted.includes("new"));
});
test("admin calls include cookie credentials and safe conflicts", async () => {
  const original = global.fetch;
  try {
    global.fetch = async (path, options) => {
      assert.equal(path, "/api/admin/destinations");
      assert.equal(options.credentials, "include");
      return {
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          message: "A record with that unique value already exists.",
        }),
      };
    };
    await assert.rejects(
      adminRequest("destinations", { method: "POST", body: destination }),
      (error) =>
        error.status === 409 &&
        error.message === "This slug is already in use.",
    );
  } finally {
    global.fetch = original;
  }
});
test("admin API never exposes unknown backend errors", async () => {
  const original = global.fetch;
  try {
    global.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        message: "SELECT password FROM admins",
      }),
    });
    await assert.rejects(
      adminRequest("stats"),
      (error) => !error.message.includes("SELECT"),
    );
  } finally {
    global.fetch = original;
  }
});
test("delete conflicts retain safe business explanation", async () => {
  const original = global.fetch;
  try {
    global.fetch = async () => ({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        message: "Content is referenced and cannot be deleted.",
      }),
    });
    await assert.rejects(
      adminRequest("packages/1", { method: "DELETE" }),
      (error) => error.message.includes("historical leads"),
    );
  } finally {
    global.fetch = original;
  }
});
