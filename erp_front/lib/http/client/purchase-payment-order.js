
import { clientRequest } from "./request";

function buildPurchasePaymentOrderQueryParams({
  search = "",
  filter = "",
  status = "",
  since = "",
  to = "",
  cursor,
  limit,
} = {}) {
  const params = new URLSearchParams();

  if (search?.trim()) params.set("search", search.trim());
  if (filter?.trim()) params.set("filter", filter.trim());
  if (status?.trim()) params.set("status", status.trim());
  if (since) params.set("since", since);
  if (to) params.set("to", to);

  if (cursor !== null && cursor !== undefined && cursor !== "") {
    params.set("cursor", String(cursor));
  }

  if (limit !== null && limit !== undefined && limit !== "") {
    params.set("limit", String(limit));
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export function getPurchasePaymentOrders(filters = {}) {
  const query = buildPurchasePaymentOrderQueryParams(filters);

  return clientRequest(`/purchase-payment-orders${query}`, {
    method: "GET",
  });
}

export function getPurchasePaymentOrderById(id) {
  if (!id) throw new Error("Purchase payment order ID is required");

  return clientRequest(`/purchase-payment-orders/${id}`, {
    method: "GET",
  });
}

export function createPurchasePaymentOrder(payload) {
  return clientRequest("/purchase-payment-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePurchasePaymentOrderStatus(id, payload) {
  if (!id) throw new Error("Purchase payment order ID is required");

  return clientRequest(`/purchase-payment-orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function approvePurchasePaymentOrder(id, payload) {
  if (!id) throw new Error("Purchase payment order ID is required");

  return clientRequest(`/purchase-payment-orders/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}