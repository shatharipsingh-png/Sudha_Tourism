import test from "node:test";
import assert from "node:assert/strict";
import { api, ApiError } from "../src/api/api.js";

test("API unwraps the existing envelope and forwards JSON, credentials and cancellation", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (path, options) => {
    assert.equal(path, "/api/leads");
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "include");
    assert.equal(options.signal, controller.signal);
    assert.deepEqual(JSON.parse(options.body), {
      type: "newsletter",
      consent: true,
    });
    return Response.json({
      success: true,
      data: { id: 1 },
      message: "Received",
    });
  });
  assert.deepEqual(
    await api("/api/leads", {
      method: "POST",
      body: { type: "newsletter", consent: true },
      credentials: "include",
      signal: controller.signal,
    }),
    { id: 1 },
  );
});
test("API hides server internals and provides bounded validation feedback", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(
      { success: false, message: "private database connection detail" },
      { status: 500 },
    ),
  );
  await assert.rejects(
    api("/api/packages"),
    (error) =>
      error instanceof ApiError &&
      error.status === 500 &&
      !error.message.includes("database"),
  );
  globalThis.fetch = async () =>
    Response.json(
      {
        success: false,
        data: { errors: { email: "Invalid email", form: 123 } },
      },
      { status: 400 },
    );
  await assert.rejects(
    api("/api/leads"),
    (error) =>
      error.fields.email === "Invalid email" && !("form" in error.fields),
  );
});
test("API preserves abort errors and rejects external endpoints", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new DOMException("Aborted", "AbortError");
  });
  await assert.rejects(api("/api/packages"), { name: "AbortError" });
  await assert.rejects(api("https://example.com/api/packages"), /relative API/);
});
