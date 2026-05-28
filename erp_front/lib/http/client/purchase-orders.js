import { clientRequest } from "./request";


export function getPurchaseOrdersByQuery({ search, filter, since, to, status, cursor, limit } = {}) {
	const query = new URLSearchParams();
	if (search) query.set("search", search);
	if (filter) query.set("filter", filter);
	if (since) query.set("since", since);
	if (to) query.set("to", to);
	if (status) query.set("status", status);
	if (cursor) query.set("cursor", cursor);
	if (limit) query.set("limit", limit);

	const queryString = query.toString();

	return clientRequest(`/purchases/purchase-orders${queryString ? `?${queryString}` : ""}`,
		{
			method: "GET",
		});
}

export function createPurchaseOrder(payload) {
  return clientRequest("/purchases/purchase-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPurchaseOrderById(id) {
	return clientRequest(`/purchases/purchase-orders/${id}`, {
		method: "GET",
	});
}

export function patchPurchaseOrder(id, payload) {
	// We use underscores to match your Rust route: /purchases/purchase_orders/{id}
	return clientRequest(`/purchases/purchase-orders/${id}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
}

export function cancelPurchaseOrder(id, payload) {
	return patchPurchaseOrder(id, payload);
}
