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
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));

  const queryString = params.toString();

  return clientRequest(
    `/purchases/supplier-credit-notes${queryString ? `?${queryString}` : ""}`,
    { method: "GET" }
  );
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

