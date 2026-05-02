import { clientRequest } from "./request";

export function getPurchaseOrdersByQuery(q) {
	return clientRequest(`/purchases/purchase-orders?q=${encodeURIComponent(q)}`, {
		method: "GET",
	});
}

export function getPurchaseOrderById(id) {
	//TODO
}
