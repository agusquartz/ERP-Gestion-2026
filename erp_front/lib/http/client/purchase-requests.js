import { clientRequest } from "./request";

// ─── Purchase Order ─────────────────────────────────────────────

export async function getPurchaseOrder(orderId) {
	return clientRequest(`/purchase/purchase-requests/${orderId}`, { method: "GET"});
}

// ─── Quotations ─────────────────────────────────────────────────

export async function saveQuotation(
  quoteId,
  activeRows,
  isComplete,
  currentStatusId
) {
  const detailsPayload = activeRows.map((row) => ({	
    product_id: row.productId,
    confirmed_quantity: row.confirmedQty,
    unit_cost: row.unitPrice,
  }));

  // Step 1
  await clientRequest(`/purchase/purchase-quotes/${quoteId}/details`, {
    method: "POST",
    body: JSON.stringify({ details: detailsPayload }),
  });

  // Step 2
  const nextStatusId = isComplete ? 4 : 3;

  if (currentStatusId === nextStatusId) return;

  await clientRequest(`/purchase/purchase-quotes/${quoteId}`, {
    method: "PATCH",
    body: JSON.stringify({ status_id: nextStatusId }),
  });
}

export function updateQuotationStatus(quoteId, statusId) {
  return clientRequest(`/purchase/purchase-quotes/${quoteId}`, {
    method: "PATCH",
    body: JSON.stringify({ status_id: statusId }),
  });
}

//export async function generateAllQuotations(orderId) {
	//return clientRequest(`/purchase-orders/${orderId}/generate-all`, {
	//	method: "POST",
	//});
//}

export async function printAllQuotations(orderId) {
	return clientRequest(`/purchase-orders/${orderId}/print-all`, {
		method: "GET",
	});
}
