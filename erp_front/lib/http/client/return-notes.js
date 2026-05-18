import { clientRequest } from "./request";

export function getReturnNotesByQuery(q) {
  const query = q?.trim() ?? "";

  return clientRequest(`/return-notes?contains=${encodeURIComponent(query)}`, {
    method: "GET",
  });
}