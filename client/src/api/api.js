export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}
export async function api(
  path,
  { method = "GET", body, signal, credentials = "same-origin" } = {},
) {
  if (!path.startsWith("/api/") || path.startsWith("//"))
    throw new Error("Use a relative API endpoint.");
  let response;
  try {
    response = await fetch(path, {
      method,
      signal,
      credentials,
      headers:
        body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("We couldn’t connect. Please try again.");
  }
  let envelope;
  try {
    envelope = await response.json();
  } catch {
    throw new ApiError(
      "We couldn’t complete that request. Please try again.",
      response.status,
    );
  }
  if (!response.ok || envelope.success !== true) {
    const message =
      response.status === 429
        ? "Please wait a few minutes before trying again."
        : response.status === 400
          ? "Please check the highlighted fields."
          : "We couldn’t complete that request. Please try again.";
    // Backend validation messages are bounded field feedback, never raw errors.
    const fields =
      response.status === 400 &&
      envelope.data?.errors &&
      typeof envelope.data.errors === "object"
        ? Object.fromEntries(
            Object.entries(envelope.data.errors)
              .filter(([, value]) => typeof value === "string")
              .map(([key, value]) => [key, value.slice(0, 200)]),
          )
        : {};
    throw new ApiError(message, response.status, fields);
  }
  return envelope.data;
}
export const getDestinations = (signal) => api("/api/destinations", { signal });
export const getFeaturedPackages = (signal) =>
  api("/api/packages?featured=true&limit=3", { signal });
export const submitLead = (body, signal) =>
  api("/api/leads", { method: "POST", body, signal });
