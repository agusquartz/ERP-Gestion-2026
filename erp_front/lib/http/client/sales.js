import { clientRequest } from "./request";

export function getProductByQuery(q) {
  return clientRequest(`/products?search=${encodeURIComponent(q)}`, {
    method: "GET",
  });
}

export function getProductById(id) {
  if (!id) throw new Error("Product ID is required");

  return clientRequest(`/products/${id}`, {
    method: "GET",
  });
}

export function getProductByCode(code) {
  if (!code) throw new Error("Product CODE is required");

  return clientRequest(`/products/code/${code}`, {
    method: "GET",
  });
}

export function createSale(payload) {
  return clientRequest("/sales", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createQuote(payload) {
  return clientRequest("/quotes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
