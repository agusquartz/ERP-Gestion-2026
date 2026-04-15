import { clientRequest } from "./request";

export function getProductByQuery(q) {
  return clientRequest(`/products?q=${encodeURIComponent(q)}`, {
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