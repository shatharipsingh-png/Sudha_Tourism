import test from "node:test";
import assert from "node:assert/strict";
import {
  enquiryPayload,
  validateEnquiry,
  whatsappUrl,
  formatPrice,
} from "../src/utils/forms.js";
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
