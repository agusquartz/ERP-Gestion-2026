import { clientRequest } from "./request";

export function getPurchaseOrdersByQuery(q) {
	return clientRequest(`/purchases/purchase-orders?q=${encodeURIComponent(q)}`, {
		method: "GET",
	});
}

export function getPurchaseOrderById(id) {
	return clientRequest(`/purchases/purchase-orders/${id}`, {
		method: "GET",
	});
}

export function patchPurchaseOrder(id, payload) {
  // We use underscores to match your Rust route: /purchases/purchase_orders/{id}
  return clientRequest(`/purchases/purchase_orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function cancelPurchaseOrder(id, payload) {
	return patchPurchaseOrder(id, payload);
}
