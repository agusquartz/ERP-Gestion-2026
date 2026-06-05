import { clientRequest } from "./request";

/**
 * Lists all supplier credit notes, optionally filtering by a search term.
 */
export function listSupplierCreditNotes({ search, filter, since, to, cursor, limit } = {}) {
  const params = new URLSearchParams();

  if (search?.trim()) params.set("search", search.trim());
  if (filter?.trim()) params.set("filter", filter.trim());
  if (since) params.set("since", since);
  if (to) params.set("to", to);
  if (cursor !== null && cursor !== undefined) params.set("cursor", String(cursor));
  if (limit !== null && limit !== undefined) params.set("limit", String(limit));

  const queryString = params.toString();

  return clientRequest(
    `/purchases/supplier-credit-notes${queryString ? `?${queryString}` : ""}`,
    { method: "GET" }
  );
}


/**
 * Creates a new supplier credit note.
 *
 * Backend DTO:
 * {
 *   note_number,
 *   return_note_id,
 *   created_at,
 *   total,
 *   details: [
 *     {
 *       product_id,
 *       quantity,
 *       unit_cost,
 *       subtotal
 *     }
 *   ]
 * }
 */
export function createSupplierCreditNote(payload) {
  if (!payload) throw new Error("Supplier Credit Note payload is required");

  return clientRequest("/purchases/supplier-credit-notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


/**
 * Retrieves a single supplier credit note aggregate by its database ID.
 * * @param {number|string} id - The credit note identifier.
 */
export function getSupplierCreditNoteById(id) {
  if (id == null) throw new Error("Supplier Credit Note ID is required");

  return clientRequest(`/purchases/supplier-credit-notes/${id}`, {
    method: "GET",
  });
}



