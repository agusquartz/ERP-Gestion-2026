// // import { clientRequest } from "./request";

// // export function getReturnNotesByQuery(q) {
// //   const query = q?.trim() ?? "";

// //   return clientRequest(`/return-notes?contains=${encodeURIComponent(query)}`, {
// //     method: "GET",
// //   });
// // }

// import { clientRequest } from "./request";

// /**
//  * Builds the query string for the return notes list endpoint.
//  *
//  * Backend DTO:
//  * ReturnNoteListQuery {
//  *   contains?: string,
//  *   statusId?: number,
//  *   fromDate?: string,
//  *   toDate?: string,
//  *   cursor?: number
//  * }
//  */
// function buildReturnNotesQuery(filters = {}) {
//   const params = new URLSearchParams();

//   if (filters.contains?.trim()) {
//     params.set("contains", filters.contains.trim());
//   }

//   if (filters.statusId !== undefined && filters.statusId !== null && filters.statusId !== "") {
//     params.set("statusId", String(filters.statusId));
//   }

//   if (filters.fromDate) {
//     params.set("fromDate", filters.fromDate);
//   }

//   if (filters.toDate) {
//     params.set("toDate", filters.toDate);
//   }

//   if (filters.cursor !== undefined && filters.cursor !== null && filters.cursor !== "") {
//     params.set("cursor", String(filters.cursor));
//   }

//   const query = params.toString();

//   return query ? `?${query}` : "";
// }

// /**
//  * Gets the list of return notes.
//  *
//  * Example:
//  * getReturnNotes({
//  *   contains: "INV-001",
//  *   statusId: 1,
//  *   fromDate: "2026-05-01",
//  *   toDate: "2026-05-19",
//  *   cursor: 10,
//  * });
//  */
// export function getReturnNotes(filters = {}) {
//   const query = buildReturnNotesQuery(filters);

//   return clientRequest(`/return-notes${query}`, {
//     method: "GET",
//   });
// }

// /**
//  * Gets a return note by its ID.
//  */
// export function getReturnNoteById(id) {
//   if (!id) throw new Error("Return note ID is required");

//   return clientRequest(`/return-notes/${id}`, {
//     method: "GET",
//   });
// }

// /**
//  * Creates a new return note.
//  *
//  * Payload example:
//  * {
//  *   purchaseInvoiceId: 1,
//  *   motive: "Damaged products",
//  *   createdAt: "2026-05-19",
//  *   details: [
//  *     {
//  *       productId: 10,
//  *       returnedQuantity: 2,
//  *       amount: "150000"
//  *     }
//  *   ]
//  * }
//  */
// export function createReturnNotes(payload) {
//   return clientRequest("/return-notes", {
//     method: "POST",
//     body: JSON.stringify(payload),
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
 *   cursor?: number,
 *   limit?: number
 * }
 */
function buildReturnNotesQuery({
  contains = "",
  statusId,
  fromDate = "",
  toDate = "",
  cursor,
  limit,
} = {}) {
  const params = new URLSearchParams();

  if (contains?.trim()) {
    params.set("contains", contains.trim());
  }

  if (statusId !== undefined && statusId !== null && statusId !== "") {
    params.set("statusId", String(statusId));
  }

  if (fromDate) {
    params.set("fromDate", fromDate);
  }

  if (toDate) {
    params.set("toDate", toDate);
  }

  if (cursor !== undefined && cursor !== null && cursor !== "") {
    params.set("cursor", String(cursor));
  }

  if (limit !== undefined && limit !== null && limit !== "") {
    params.set("limit", String(limit));
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

/**
 * Gets the full return notes list view:
 * {
 *   returnNotes: [],
 *   hasMore: true
 * }
 */
export function getReturnNotesView(filters = {}) {
  const query = buildReturnNotesQuery(filters);

  return clientRequest(`/return-notes${query}`, {
    method: "GET",
  });
}

/**
 * Backwards-compatible helper.
 * Returns only the array.
 */
export async function getReturnNotes(filters = {}) {
  const response = await getReturnNotesView(filters);

  if (Array.isArray(response)) {
    return response;
  }

  return response?.returnNotes ?? response?.return_notes ?? [];
}

export function getReturnNoteById(id) {
  if (!id) throw new Error("Return note ID is required");

  return clientRequest(`/return-notes/${id}`, {
    method: "GET",
  });
}

export function getReturnNotesByInvoiceId(invoice_id) {
  if (!invoice_id) throw new Error("Invoice ID is required");

  return clientRequest(`/return-notes/by-invoice/${invoice_id}`, {
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
export function createReturnNotes(payload) {
  return clientRequest("/return-notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
