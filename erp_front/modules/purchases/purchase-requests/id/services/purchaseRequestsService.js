/**
 * @file purchaseRequestsService.js
 * @module modules/purchases/services
 *
 * @description
 * Service layer responsible for all Purchase Order API interactions.
 * This is the ONLY place where HTTP requests are made.
 * Components and hooks must never call fetch directly.
 *
 * Why this layer exists:
 *   - Centralizes API logic
 *   - Ensures consistent error handling
 *   - Makes it easy to switch between mock and real backend
 */

// ─── Config ───────────────────────────────────────────────────────────────────
//const API_BASE = "http://localhost:3000";
// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Generic HTTP helper used by all service functions.
 *
 * What it is:
 *   A wrapper around the native fetch API that standardizes requests.
 *
 * What it receives:
 *   @param {string} url - Endpoint URL
 *   @param {Object} options - fetch configuration
 *
 * What it returns:
 *   @returns {Promise<any>} Parsed JSON response
 *
 * What it does:
 *   - Executes HTTP request
 *   - Parses JSON response
 *   - Throws error if request fails
 *
 * Why it's important:
 *   - Prevents duplicated fetch logic
 *   - Centralizes error handling
 */

/*
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let errorBody = null;
    try {
      errorBody = raw ? JSON.parse(raw) : null;
    } catch {
      errorBody = raw;
    }

    console.error("API ERROR", { url, status: response.status, body: errorBody });

    throw new Error(
      (errorBody && typeof errorBody === "object" && errorBody.message) ||
        (typeof errorBody === "string" && errorBody) ||
        `Request failed with status ${response.status}`
    );
  }

  return response.json();
}*/

// ─── Purchase Order ───────────────────────────────────────────────────────────

/**
 * Fetches the full purchase request (header + items + quotes)
 * 
 * @param {number} orderId
 * @returns {Promise<Object> rar backend response}
 */

/*
export async function getPurchaseOrder(orderId) {
  return apiFetch(`${API_BASE}/purchase-requests/${orderId}`);
}*/

// ─── Quotations ───────────────────────────────────────────────────────────────

/**
 * Saves confirmed product lines for a quote and updates its status.
 *
 * Step 1 — POST /purchase-quotes/:quoteId/details
 *   Replaces all existing detail rows (DELETE + INSERT on backend).
 *   Only active (non-excluded) rows are sent.
 *
 * Step 2 — PATCH /purchase-quotes/:quoteId
 *   Advances the status:
 *     UNSENT  (2) → PENDING (3)  if any active row is incomplete
 *     UNSENT  (2) → READY   (4)  if all active rows are complete
 *     PENDING (3) → READY   (4)  if now complete
 *
 * @param {number}  quoteId       - The purchase_quotes.id
 * @param {Array}   activeRows    - Non-excluded rows (already filtered by the hook)
 * @param {boolean} isComplete    - True if all rows have qty > 0 and price > 0
 * @param {number}  currentStatus - Current statusId (used to determine valid transition)
 */

/*
export async function saveQuotation(quoteId, activeRows, isComplete, currentStatusId) {
  //Step 1 - Save detail rows
  const detailsPayload = activeRows.map((row) => ({
    product_id:         row.productId,
    confirmed_quantity: row.confirmedQty,
    unit_cost:          row.unitPrice,
  }));

  await apiFetch(`${API_BASE}/purchase-quotes/${quoteId}/details`, {
    method: "POST",
    body:   JSON.stringify({ details: detailsPayload }),
  });
  
// Step 2 — Determine and apply next status
  // Status IDs: 2=unsent, 3=pending, 4=ready

  const nextStatusId = isComplete ? 4 : 3;

  // Skip PATCH if status wouldn't change (e.g. already PENDING and still incomplete)
  if (currentStatusId === nextStatusId) return;

  await apiFetch(`${API_BASE}/purchase-quotes/${quoteId}`, {
    method: "PATCH",
    body:   JSON.stringify({ status_id: nextStatusId }),
  });
}*/

/**
 * Updates only the status of a quote.
 * Used for "Generar" (CREATED → UNSENT) and "Imprimir" (UNSENT → PENDING).
 *
 * @param {number} quoteId  - The purchase_quotes.id
 * @param {number} statusId - Target status ID
 */

/*
export async function updateQuotationStatus(quoteId, statusId) {
  return apiFetch(`${API_BASE}/purchase-quotes/${quoteId}`, {
    method: "PATCH",
    body:   JSON.stringify({ status_id: statusId }),
  });
}*/

/**
 * Generates quotations for all suppliers.
 *
 * What it receives:
 *   @param {string} orderId
 *
 * What it returns:
 *   @returns {Promise<void>}
 *
 * What it does:
 *   - Triggers backend process (emails, notifications, etc.)
 *
 * Why it's important:
 *   - Starts supplier interaction workflow
 */

/*
export async function generateAllQuotations(orderId) {
  await apiFetch(`${API_BASE}/purchase-orders/${orderId}/generate-all`, {
    method: "POST",
  });
}*/

/**
 * Retrieves printable version of quotations.
 *
 * What it receives:
 *   @param {string} orderId
 *
 * What it returns:
 *   @returns {Promise<{ printUrl: string }>}
 *
 * What it does:
 *   - Requests printable document from backend
 *
 * Why it's important:
 *   - Final step for exporting/printing quotations
 */

/*
export async function printAllQuotations(orderId) {
  return apiFetch(`${API_BASE}/purchase-orders/${orderId}/print-all`, {
    method: "GET",
  });
}*/

// ─── Suppliers ────────────────────────────────────────────────────────────────
/**
 * Fetches available suppliers filtered by the given category names.
 * Backend returns only suppliers that handle at least one matching category.
 *
 * @param {string[]} categories
 * @returns {Promise<Array<{ id, name, categories }>>}
 */

/*
export async function getAvailableSuppliers(categories) {
  const params = new URLSearchParams({ categories: categories.join(",") });
  return apiFetch(`${API_BASE}/suppliers/available?${params}`);
}*/

/**
 * Adds suppliers to a purchase order by creating one purchase_quote per supplier.
 *
 * Each POST /purchase-quotes call creates a quote with status CREATED (2).
 * Returns the new supplier rows in frontend shape so the hook can append
 * them to state without re-fetching the full order.
 *
 * @param {string|number} orderId
 * @param {number[]}      supplierIds
 * @returns {Promise<Array<{ id, supplierId, name, statusId, quotationItems, categories }>>}
 */

/*
export async function addSuppliers(orderId, supplierIds) {
  // Create one quote per selected supplier
  const results = await Promise.all(
    supplierIds.map((supplierId) =>
      apiFetch(`${API_BASE}/purchase-quotes`, {
        method: "POST",
        body:   JSON.stringify({
          purchase_request_id: parseInt(orderId),
          supplier_id: supplierId,
        }),
      })
    )
  );

  // Map backend response to frontend supplier shape
  return results.map((q) => ({
    id:             q.id,               // quote_id - used for all subsequent calls
    supplierId:     q.supplier_id,   
    name:           q.supplier_name,
    statusId:       q.status_id ?? 1,   // always CREATED on creation
    quotationItems: [],
    categories:     q.categories,
  }));
}*/

import { getPurchaseOrder, saveQuotation, updateQuotationStatus } from "@/lib/http/client/purchase-requests"
import { getAvailableSuppliers, addSuppliers } from "@/lib/http/client/suppliers";

export {
  getPurchaseOrder,
  saveQuotation,
  updateQuotationStatus,
  printAllQuotations,
  getAvailableSuppliers,
  addSuppliers,
};