import { clientRequest } from "./request";

export function getClients(query = "") {
  const path = query
    ? `/clients?q=${encodeURIComponent(query)}`
    : "/clients";

  return clientRequest(path, { method: "GET" });
}

export function getClientById(id) {
  if (!id) throw new Error("Client ID is required");
  return clientRequest(`/clients/${id}`, { method: "GET" });
}

export function createClient(payload) {
  return clientRequest("/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function editClient(id, payload) {
  if (!id) throw new Error("Client ID is required");
  return clientRequest(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}