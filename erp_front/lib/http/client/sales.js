import { clientRequest } from "./request";

function buildProductQueryParams({
  search = "",
  filter = "",
  status = "",
  since = "",
  to = "",
  cursor,
  limit,
} = {}) {
  const params = new URLSearchParams();

  if (search?.trim()) params.set("search", search.trim());
  if (filter?.trim()) params.set("filter", filter.trim());
  if (status?.trim()) params.set("status", status.trim());
  if (since) params.set("since", since);
  if (to) params.set("to", to);

  if (cursor !== null && cursor !== undefined && cursor !== "") {
    params.set("cursor", String(cursor));
  }

  if (limit !== null && limit !== undefined && limit !== "") {
    params.set("limit", String(limit));
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export function getProductByQuery(filters = {}) {
  const normalizedFilters =
    typeof filters === "string"
      ? { search: filters }
      : filters;

  const query = buildProductQueryParams(normalizedFilters);

  return clientRequest(`/products${query}`, {
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
