import { clientRequest } from "@/lib/http/client/request";

/**
 * GET /purchases/purchase-requests/{id}
 * Returns the full purchase request aggregate.
 */
export function getPurchaseRequestById(id) {
  if (!id) throw new Error("Purchase request ID is required");
  return clientRequest(`/purchases/purchase-requests/${id}`, { method: "GET" });
}

/**
 * POST /purchases/purchase-requests/{id}
 * Creates a new quote linked to the purchase request.
 *
 * @param {number} id - Purchase request ID
 * @param {{ purchaseRequestId, supplierId, createdAt, details }} body
 */
export function createPurchaseQuote(id, body) {
  if (!id) throw new Error("Purchase request ID is required");
  return clientRequest(`/purchases/purchase-requests/${id}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PATCH /purchases/purchase-requests/{id}
 * Updates status, dates and/or line details of an existing quote.
 *
 * @param {number} id - Purchase request ID
 * @param {{ quoteId, statusId, dateSent?, dateReceived?, details? }} body
 */
export function patchPurchaseQuote(id, body) {
  if (!id) throw new Error("Purchase request ID is required");
  return clientRequest(`/purchases/purchase-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function listPurchaseRequests({
  contains = "",
  search = "",
  filter = "",
  status = "",
  since = "",
  to = "",
  cursor,
  limit,
} = {}) {
  const params = new URLSearchParams();

  const cleanContains = String(contains || search || "").trim();

  if (cleanContains) {
    params.set("contains", cleanContains);
  }

  if (filter?.trim()) {
    params.set("filter", filter.trim());
  }

  if (status?.trim()) {
    params.set("status", status.trim());
  }

  if (since) {
    params.set("since", since);
  }

  if (to) {
    params.set("to", to);
  }

  if (cursor !== null && cursor !== undefined && cursor !== "") {
    params.set("cursor", String(cursor));
  }

  if (limit !== null && limit !== undefined && limit !== "") {
    params.set("limit", String(limit));
  }

  const queryString = params.toString();

  return clientRequest(
    `/purchases/purchase-requests${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    }
  );
}

export function searchProductsForPurchaseRequest({ contains } = {}) {
  const params = new URLSearchParams();

  if (contains?.trim()) {
    params.set("contains", contains.trim());
  }

  const queryString = params.toString();

  return clientRequest(
    `/purchases/purchase-request-products${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    }
  );
}

export function createPurchaseRequest(payload){

  console.log("Enviando a Rust:", payload);

  return clientRequest(`/purchases/purchase-requests`, {
    method:'POST',
    body: JSON.stringify(payload),
  })
}
