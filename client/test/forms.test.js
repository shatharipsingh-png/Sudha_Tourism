import test from "node:test";
import assert from "node:assert/strict";
import {
  enquiryPayload,
  validateEnquiry,
  whatsappUrl,
  formatPrice,
  bookingPayload,
  validateBooking,
  contactPayload,
  validateContact,
  tomorrowUtc,
} from "../src/utils/forms.js";
test("booking payload contains only supported fields and remains a request", () => {
  const values = {
    name: " Test ",
    email: "test@example.invalid",
    phone: "+919876543210",
    travel_date: "2030-01-01",
    travelers: "2",
    room_preference: "double",
    message: " A request ",
    website: "",
    destination_id: 9,
  };
  const body = JSON.parse(JSON.stringify(bookingPayload(values, 3)));
  assert.deepEqual(body, {
    type: "booking",
    name: "Test",
    email: "test@example.invalid",
    phone: "+919876543210",
    package_id: 3,
    travel_date: "2030-01-01",
    travelers: 2,
    message: "A request",
    details: { room_preference: "double" },
  });
  assert.deepEqual(
    validateBooking(values, 3, new Date("2026-10-04T23:00:00Z")),
    {},
  );
});
test("booking rejects non-future or impossible dates and invalid traveler counts", () => {
  const values = {
    name: "Test",
    email: "test@example.invalid",
    phone: "+919876543210",
    travel_date: "2026-10-04",
    travelers: "2",
  };
  const now = new Date("2026-10-04T23:00:00Z");
  for (const date of ["2026-10-04", "2026-02-30", "invalid", ""])
    assert.ok(
      validateBooking({ ...values, travel_date: date }, 3, now).travel_date,
    );
  for (const travelers of ["", "0", "51", "1.5"])
    assert.ok(
      validateBooking(
        { ...values, travel_date: "2030-01-01", travelers },
        3,
        now,
      ).travelers,
    );
  assert.equal(tomorrowUtc(now), "2026-10-05");
});
test("contact accepts omitted phone and requires a meaningful message", () => {
  const values = {
    name: " Test ",
    email: "test@example.invalid",
    phone: " ",
    message: " Hello, please help with my journey. ",
    website: "",
  };
  assert.deepEqual(JSON.parse(JSON.stringify(contactPayload(values))), {
    type: "contact",
    name: "Test",
    email: "test@example.invalid",
    message: "Hello, please help with my journey.",
  });
  assert.deepEqual(validateContact(values), {});
  assert.ok(validateContact({ ...values, message: "short" }).message);
  assert.ok(validateContact({ ...values, phone: "bad" }).phone);
});
test("enquiry maps contextual IDs and optional inputs to the established lead contract", () => {
  const values = {
    name: " Test ",
    email: "test@example.invalid",
    phone: "+919876543210",
    travelers: "2",
    travel_type: "family",
    budget: " Flexible ",
    message: "",
    website: "",
  };
  const payload = JSON.parse(
    JSON.stringify(enquiryPayload(values, { packageId: 3, destinationId: 2 })),
  );
  assert.deepEqual(payload, {
    type: "enquiry",
    name: "Test",
    email: "test@example.invalid",
    phone: "+919876543210",
    destination_id: 2,
    package_id: 3,
    travelers: 2,
    details: { travel_type: "family", budget: "Flexible" },
  });
  assert.deepEqual(validateEnquiry(values), {});
  assert.ok(validateEnquiry({ ...values, travelers: "1.5" }).travelers);
});
test("unconfigured WhatsApp is hidden and missing prices never become free offers", () => {
  assert.equal(whatsappUrl("PLACEHOLDER"), null);
  assert.equal(whatsappUrl("javascript:alert(1)"), null);
  assert.ok(
    whatsappUrl("+919876543210").startsWith("https://wa.me/919876543210?text="),
  );
  for (const value of [null, undefined, "", "invalid"])
    assert.equal(formatPrice(value), "Price on enquiry");
});
