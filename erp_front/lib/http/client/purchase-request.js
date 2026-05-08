import { clientRequest } from "./request";


export function listPurchaseRequests({ contains } = {}) {
  const params = new URLSearchParams();

  if (contains?.trim()) {
    params.set("contains", contains.trim());
  }

  const queryString = params.toString();

  return clientRequest(`/purchase-requests${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
}

export function getPurchaseRequestById(id) {
  if (id == null) throw new Error("Purchase Request ID is required");

  return clientRequest(`/purchase-requests/${id}`, {
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