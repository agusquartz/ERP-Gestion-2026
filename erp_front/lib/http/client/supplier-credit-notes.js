import { clientRequest } from "./request";

/**
 * Lists all supplier credit notes, optionally filtering by a search term.
 * * @param {Object} query - Optional query filters.
 * @param {string} query.contains - Filter by note number or related data.
 */
export function listSupplierCreditNotes({ contains } = {}) {
  const params = new URLSearchParams();

  if (contains?.trim()) {
    params.set("contains", contains.trim());
  }

  const queryString = params.toString();

  return clientRequest(
    `/purchases/supplier-credit-notes${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    }
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

