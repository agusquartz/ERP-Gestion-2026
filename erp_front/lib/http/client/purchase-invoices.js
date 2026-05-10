import { clientRequest } from "./request";

export async function fetchPurchaseInvoices({ search, from, to, status } = {}) {
	const query = new URLSearchParams();
	if (search) query.set("search", search);
	if (from) 	query.set("from", from);
	if (to)  	query.set("to", to);
	if (status) query.set("status", status);

	return clientRequest(`/purchases/purchase-invoices?${query.toString()}`, {
		method: "GET",
  	});
}