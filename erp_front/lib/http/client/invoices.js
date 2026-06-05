import { clientRequest } from "./request";

export function createInvoice(payload) {
  return clientRequest("/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export function listInvoices({ contains } = {}) {
  const params = new URLSearchParams();

  if (contains?.trim()) {
    params.set("search", contains.trim());
	params.set("limit", 10000);
  }

  const queryString = params.toString();

  return clientRequest(`/invoices${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
}

export function getInvoiceById(id) {
  if (id == null) throw new Error("Invoice ID is required");

  return clientRequest(`/invoices/${id}`, {
    method: "GET",
  });
}
