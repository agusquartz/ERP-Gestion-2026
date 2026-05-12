import { clientRequest } from "./request";

export async function fetchPurchaseInvoices({ search, filter, from, to, status } = {}) {
	const query = new URLSearchParams();
	if (search) query.set("search", search);
	if (filter)	query.set("filter", filter);
	if (from) 	query.set("from", from);
	if (to)  	query.set("to", to);
	if (status) query.set("status", status);

	return clientRequest(`/purchases/purchase-invoices?${query.toString()}`, {
		method: "GET",
  	});
}