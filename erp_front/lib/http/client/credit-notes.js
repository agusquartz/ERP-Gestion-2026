"use client";

import { clientRequest } from "./request";

export function createCreditNote(payload) {
  return clientRequest("/credit-notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listCreditNotes({ contains } = {}) {
  const params = new URLSearchParams();

  if (contains?.trim()) {
    params.set("contains", contains.trim());
  }

  const queryString = params.toString();

  return clientRequest(`/credit-notes${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
}

export function getCreditNoteById(id) {
  if (id == null) throw new Error("Credit note ID is required");

  return clientRequest(`/credit-notes/${id}`, {
    method: "GET",
  });
}