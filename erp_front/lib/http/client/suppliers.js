import { clientRequest } from "./request";

export async function getAvailableSuppliers(categories) {
  const params = new URLSearchParams({ categories: categories.join(",") });
  return clientRequest(`/suppliers/available?${params}`, { method: "GET" });
}

export async function addSuppliers(orderId, supplierIds) {

  const results = await Promise.all(
    supplierIds.map((supplierId) =>
      clientRequest(`/purchase/purchase-quotes`, {
        method: "POST",
        body:   JSON.stringify({
          purchase_request_id: parseInt(orderId),
          supplier_id: supplierId,
        }),
      })
    )
  );

  return results.map((q) => ({
    id:             q.id,               
    supplierId:     q.supplier_id,   
    name:           q.supplier_name,
    statusId:       q.status_id ?? 1,  
    quotationItems: [],
    categories:     q.categories,
  }));
}
