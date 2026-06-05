import { clientRequest } from "./request";

export function createPurchaseInvoice(payload) {
	return clientRequest("/purchases/purchase-invoices", {
		method: "POST",
   	body: JSON.stringify(payload),
  });
}

export function fetchPurchaseInvoices({ search, filter, since, to, status, cursor, limit } = {}) {
	const query = new URLSearchParams();
	if (search) query.set("search", search);
	if (filter)	query.set("filter", filter);
	if (since) 	query.set("since", since);
	if (to)  	query.set("to", to);
	if (status) query.set("status", status);
	if (cursor) query.set("cursor", cursor);
	if (limit)	query.set("limit", limit);
	
	return clientRequest(`/purchases/purchase-invoices?${query.toString()}`, {
		method: "GET",
  });
}

export function getPurchaseInvoiceById(id) {
	if (id == null) throw new Error("Purchase Invoice ID is required");

	return clientRequest(`/purchases/purchase-invoices/${id}`, {
	  method: "GET",
	});
}

export function getPurchaseInvoicesByOrderId(order_id) {
	if (order_id == null) throw new Error("Purchase Order ID is required");
	
	return clientRequest(`/purchases/purchase-invoices/by-order/${order_id}`, {
	  method: "GET",
	});
}
