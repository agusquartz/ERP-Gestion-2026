
import { clientRequest } from "./request";

export function getPurchasePaymentOrders(contains) {
  const query = contains ? `?contains=${encodeURIComponent(contains)}` : "";

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