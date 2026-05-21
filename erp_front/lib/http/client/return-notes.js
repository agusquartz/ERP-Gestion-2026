import { clientRequest } from "./request";

export function createReturnNotes(payload) {

  console.log("Enviando a Rust:", payload);

  return clientRequest("/return-notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getReturnNotesByQuery(q) {
  const query = q?.trim() ?? "";

  return clientRequest(`/return-notes?contains=${encodeURIComponent(query)}`, {
    method: "GET",
  });
}