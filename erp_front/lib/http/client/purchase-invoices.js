import { clientRequest } from "./request";

export function createPurchaseInvoice(payload) {
	return clientRequest("/purchases/purchase-invoices", {
		method: "POST",
   	body: JSON.stringify(payload),
  });
}

export function fetchPurchaseInvoices({ search, filter, from, to, status, cursor, limit } = {}) {
	const query = new URLSearchParams();
	if (search) query.set("search", search);
	if (filter)	query.set("filter", filter);
	if (from) 	query.set("from", from);
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