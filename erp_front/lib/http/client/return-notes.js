// import { clientRequest } from "./request";

// export function getReturnNotesByQuery(q) {
//   const query = q?.trim() ?? "";

//   return clientRequest(`/return-notes?contains=${encodeURIComponent(query)}`, {
//     method: "GET",
//   });
// }

import { clientRequest } from "./request";

/**
 * Builds the query string for the return notes list endpoint.
 *
 * Backend DTO:
 * ReturnNoteListQuery {
 *   contains?: string,
 *   statusId?: number,
 *   fromDate?: string,
 *   toDate?: string,
 *   cursor?: number
 * }
 */
function buildReturnNotesQuery(filters = {}) {
  const params = new URLSearchParams();

  if (filters.contains?.trim()) {
    params.set("contains", filters.contains.trim());
  }

  if (filters.statusId !== undefined && filters.statusId !== null && filters.statusId !== "") {
    params.set("statusId", String(filters.statusId));
  }

  if (filters.fromDate) {
    params.set("fromDate", filters.fromDate);
  }

  if (filters.toDate) {
    params.set("toDate", filters.toDate);
  }

  if (filters.cursor !== undefined && filters.cursor !== null && filters.cursor !== "") {
    params.set("cursor", String(filters.cursor));
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

/**
 * Gets the list of return notes.
 *
 * Example:
 * getReturnNotes({
 *   contains: "INV-001",
 *   statusId: 1,
 *   fromDate: "2026-05-01",
 *   toDate: "2026-05-19",
 *   cursor: 10,
 * });
 */
export function getReturnNotes(filters = {}) {
  const query = buildReturnNotesQuery(filters);

  return clientRequest(`/return-notes${query}`, {
    method: "GET",
  });
}

/**
 * Gets a return note by its ID.
 */
export function getReturnNoteById(id) {
  if (!id) throw new Error("Return note ID is required");

  return clientRequest(`/return-notes/${id}`, {
    method: "GET",
  });
}

/**
 * Creates a new return note.
 *
 * Payload example:
 * {
 *   purchaseInvoiceId: 1,
 *   motive: "Damaged products",
 *   createdAt: "2026-05-19",
 *   details: [
 *     {
 *       productId: 10,
 *       returnedQuantity: 2,
 *       amount: "150000"
 *     }
 *   ]
 * }
 */
export function createReturnNote(payload) {
  return clientRequest("/return-notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}