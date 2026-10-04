import { api, ApiError } from "../api/api.js";
const safeMessages = {
  "A record with that unique value already exists.":
    "This slug is already in use.",
  "Content is referenced and cannot be deleted.":
    "This content is referenced by packages or historical leads and cannot be deleted.",
  "Invalid lead status transition.":
    "That status change is not allowed. Reload the lead and try again.",
  "Lead changed; reload before updating.":
    "This lead changed. Reload it before updating.",
  "Invalid destination.": "The selected destination is no longer available.",
  "Invalid linked content.":
    "The selected linked content is no longer available.",
  "Content not found.": "This content no longer exists.",
};
export async function adminRequest(path, options = {}) {
  try {
    return await api(`/api/admin/${path}`, {
      ...options,
      credentials: "include",
      safeMessages,
    });
  } catch (error) {
    if (error.status === 413)
      throw new ApiError(
        "This content is too large to save. Shorten the text or remove some list items, then try again.",
        413,
      );
    throw error;
  }
}
