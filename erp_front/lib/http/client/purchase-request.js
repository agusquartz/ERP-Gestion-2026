import { clientRequest } from "./request";


export function listPurchaseRequests({ contains } = {}) {
  const params = new URLSearchParams();

  if (contains?.trim()) {
    params.set("contains", contains.trim());
  }

  const queryString = params.toString();

  return clientRequest(`/purchases/purchase-requests${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
}

export function getPurchaseRequestById(id) {
  if (id == null) throw new Error("Purchase Request ID is required");

  return clientRequest(`/purchases/purchase-requests/${id}`, {
    method: "GET",
  });
}

export function searchProductsForPurchaseRequest({ contains } = {}) {
  const params = new URLSearchParams();

  if (contains?.trim()) {
    params.set("contains", contains.trim());
  }

  const queryString = params.toString();

  return clientRequest(
    `/purchase-request-products${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    }
  );
}

export function createPurchaseRequest(payload){

  console.log("Enviando a Rust:", payload);

  return clientRequest(`/purchases/purchase-requests`, {
    method:'POST',
    body: JSON.stringify(payload),
  })
}
