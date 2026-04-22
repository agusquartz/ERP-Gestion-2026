/**
 * @file purchaseOrderService.js
 * @module modules/purchases/services
 *
 * @description
 * Service layer for all Purchase Order API interactions.
 * This is the ONLY place in this module that communicates with the backend.
 * Components and hooks must never call fetch/axios directly — always go through here.
 *
 * Base URL: all endpoints are relative to /api/purchase-orders
 *
 * Authentication:
 * If your backend requires a Bearer token, add it to every request like this:
 *   headers: {
 *     "Content-Type": "application/json",
 *     Authorization: `Bearer ${getToken()}`,
 *   }
 * Replace getToken() with whatever auth utility your project uses.
 *
 * Error handling:
 * All functions throw on non-OK responses. The hook (usePurchaseOrder.js)
 * is responsible for catching errors and updating UI state accordingly.
 */

// ─── Base URL ─────────────────────────────────────────────────────────────────
// TODO: Move this to an environment variable (e.g. process.env.NEXT_PUBLIC_API_URL)
const API_BASE = "http://localhost:3000";

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Thin wrapper around fetch that throws a descriptive error on non-OK responses.
 * All service functions use this instead of calling fetch directly.
 *
 * @param {string} url     - Full URL to fetch.
 * @param {Object} options - Standard fetch options (method, headers, body, etc.).
 * @returns {Promise<any>} Parsed JSON response body.
 * @throws {Error} If the response status is not in the 2xx range.
 */
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      // TODO: Add auth header here if your backend requires it:
      // Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // Attempt to parse a backend error message; fall back to HTTP status text
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ?? `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

// ─── Purchase Order ───────────────────────────────────────────────────────────

/**
 * Fetches the header data of a single purchase order.
 *
 * Expected response shape:
 *   { id: string, requester: string, createdAt: string }
 *
 * @param {string} orderId - The purchase order ID (e.g. "PC-01").
 * @returns {Promise<Object>} Purchase order header object.
 */
export async function getPurchaseOrder(orderId) {
  return apiFetch(`${API_BASE}/purchase-orders/${orderId}`);
}

/**
 * Fetches all line items (products) belonging to a purchase order.
 *
 * Expected response shape:
 *   Array<{ id: number, code: string, product: string, category: string, quantity: number }>
 *
 * @param {string} orderId - The purchase order ID.
 * @returns {Promise<Array>} List of order items.
 */
export async function getPurchaseOrderItems(orderId) {
  return apiFetch(`${API_BASE}/purchase-orders/${orderId}/items`);
}

/**
 * Fetches all suppliers assigned to a purchase order, including their quotation status.
 *
 * Expected response shape:
 *   Array<{
 *     id: number,
 *     name: string,
 *     status: "generar" | "pendiente" | "listo",
 *     quotationItems: Array<{ orderItemId: number, confirmedQty: number, unitPrice: number }>
 *   }>
 *
 * @param {string} orderId - The purchase order ID.
 * @returns {Promise<Array>} List of assigned suppliers with quotation data.
 */
export async function getPurchaseOrderSuppliers(orderId) {
  return apiFetch(`${API_BASE}/purchase-orders/${orderId}/suppliers`);
}

// ─── Quotations ───────────────────────────────────────────────────────────────

/**
 * Saves (creates or updates) a supplier's quotation response for a purchase order.
 * Called when the user fills in confirmed quantities and unit prices in QuotationModal.
 *
 * Request body:
 *   { quotationItems: Array<{ orderItemId: number, confirmedQty: number, unitPrice: number }> }
 *
 * Expected response shape:
 *   { supplierId: number, status: "listo", quotationItems: Array<...> }
 *
 * @param {string} orderId        - The purchase order ID.
 * @param {number} supplierId     - The supplier ID whose quotation is being saved.
 * @param {Array}  quotationItems - Updated rows from the modal form.
 * @returns {Promise<Object>} The updated supplier object returned by the backend.
 */
export async function saveQuotation(orderId, supplierId, quotationItems) {
  return apiFetch(
    `${API_BASE}/purchase-orders/${orderId}/suppliers/${supplierId}/quotation`,
    {
      method: "PUT",
      body: JSON.stringify({ quotationItems }),
    }
  );
}

/**
 * Triggers quotation generation for ALL suppliers currently in "generar" status.
 * The backend is responsible for sending notification emails / messages to each supplier.
 *
 * No request body required.
 * No response body expected (204 No Content is fine).
 *
 * @param {string} orderId - The purchase order ID.
 * @returns {Promise<void>}
 */
export async function generateAllQuotations(orderId) {
  await apiFetch(`${API_BASE}/purchase-orders/${orderId}/generate-all`, {
    method: "POST",
  });
}

/**
 * Prints all quotations for a purchase order.
 * The backend may return a PDF blob or a printable URL.
 *
 * Expected response shape:
 *   { printUrl: string } — URL the client can open in a new tab for printing.
 *
 * TODO: Adjust the response handling below to match what your backend returns.
 *
 * @param {string} orderId - The purchase order ID.
 * @returns {Promise<Object>} Object containing the print URL or blob.
 */
export async function printAllQuotations(orderId) {
  return apiFetch(`${API_BASE}/purchase-orders/${orderId}/print-all`, {
    method: "GET",
  });
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

/**
 * Fetches available suppliers that can be added to a purchase order.
 * The backend filters results to only include suppliers that handle at least
 * one of the categories present in the order — no client-side filtering needed.
 *
 * Query params sent: ?categories=NEUMATICOS,LLANTAS
 *
 * Expected response shape:
 *   Array<{ id: number, name: string, categories: string[] }>
 *
 * @param {string}   orderId    - The purchase order ID (used for context/auth on the backend).
 * @param {string[]} categories - Category names to filter by (e.g. ["NEUMATICOS", "LLANTAS"]).
 * @returns {Promise<Array>} List of available suppliers matching the given categories.
 */
export async function getAvailableSuppliers(orderId, categories) {
  const params = new URLSearchParams({ categories: categories.join(",") });
  return apiFetch(`${API_BASE}/suppliers/available?${params}`);
}

/**
 * Adds one or more suppliers to an existing purchase order.
 * After this call, each added supplier will appear with status "generar".
 *
 * Request body:
 *   { supplierIds: number[] }
 *
 * Expected response shape:
 *   Array<{ id, name, status: "generar", quotationItems: [] }>
 *   — the backend returns the newly added suppliers in their initial state.
 *
 * @param {string}   orderId     - The purchase order ID.
 * @param {number[]} supplierIds - IDs of the suppliers to add.
 * @returns {Promise<Array>} The newly added supplier objects from the backend.
 */
export async function addSuppliers(orderId, supplierIds) {
  return apiFetch(`${API_BASE}/purchase-orders/${orderId}/suppliers`, {
    method: "POST",
    body: JSON.stringify({ supplierIds }),
  });
}