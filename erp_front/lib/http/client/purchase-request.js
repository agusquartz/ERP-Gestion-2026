
import { clientRequest } from "./request";

export function getPurchaseRequestsByQuery(q) {
  return clientRequest(`/purchase-requests?q=${encodeURIComponent(q)}`, {
    method: "GET",
  });
}