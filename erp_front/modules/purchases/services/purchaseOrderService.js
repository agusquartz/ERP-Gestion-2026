/**
 * @file purchaseOrderService.js
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

const USE_MOCK = false;
const API_BASE = "http://localhost:3000";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ORDER_ITEMS = [
  { id: 1, code: "9780201379623", product: "Neumático 185/65 R15", category: "NEUMÁTICOS", quantity: 150 },
  { id: 2, code: "3234343545493", product: "Neumático 265/85 R17", category: "NEUMÁTICOS", quantity: 600 },
  { id: 3, code: "6767576889000", product: "Llanta deportiva 18\" O2 Racing", category: "LLANTAS", quantity: 45 },
  { id: 4, code: "3476091234546", product: "Aceite Sintético SW-30L Castrol", category: "LUBRICANTES", quantity: 87 },
];

const MOCK_SUPPLIERS = [];

const MOCK_AVAILABLE_SUPPLIERS = [
  { id: 4, name: "Neumáticos del Oeste", categories: ["NEUMÁTICOS"] },
  { id: 5, name: "Lubricentro Central", categories: ["LUBRICANTES"] },
  { id: 6, name: "Ruedas y Más", categories: ["NEUMÁTICOS", "LLANTAS"] },
];

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 300));

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
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ?? `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

// ─── Purchase Order ───────────────────────────────────────────────────────────

/**
 * Fetches purchase order header information.
 *
 * What it receives:
 *   @param {string} orderId
 *
 * What it returns:
 *   @returns {Promise<{ id, requester, createdAt }>}
 *
 * What it does:
 *   - Returns mock data OR fetches from backend
 *
 * Why it's important:
 *   - Provides context for the entire purchase flow
 */
export async function getPurchaseOrder(orderId) {
  if (USE_MOCK) {
    await mockDelay();
    return MOCK_PURCHASE_ORDER;
  }
  return apiFetch(`${API_BASE}/purchase-requests/${orderId}`);
}

// ─── Quotations ───────────────────────────────────────────────────────────────

/**
 * Saves supplier quotation data.
 *
 * What it receives:
 *   @param {string} orderId
 *   @param {number} supplierId
 *   @param {Array<{ orderItemId, confirmedQty, unitPrice }>} quotationItems
 *
 * What it returns:
 *   @returns {Promise<{ supplierId, status, quotationItems }>}
 *
 * What it does:
 *   - Persists supplier response
 *
 * Why it's important:
 *   - Core action of the quotation flow
 */
export async function saveQuotation(orderId, supplierId, quotationItems) {
  if (USE_MOCK) {
    await mockDelay();
    console.log("[Mock] saveQuotation", { orderId, supplierId, quotationItems });
    return { supplierId, status: "listo", quotationItems };
  }

  return apiFetch(
    `${API_BASE}/purchase-quotes/${supplierId}/details`,
    {
      method: "POST",
      body: JSON.stringify({ quotationItems }),
    }
  );
}

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
export async function generateAllQuotations(orderId) {
  if (USE_MOCK) {
    await mockDelay();
    return;
  }

  await apiFetch(`${API_BASE}/purchase-orders/${orderId}/generate-all`, {
    method: "POST",
  });
}

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
export async function printAllQuotations(orderId) {
  if (USE_MOCK) {
    await mockDelay();
    return { printUrl: "/mock-print.pdf" };
  }

  return apiFetch(`${API_BASE}/purchase-orders/${orderId}/print-all`, {
    method: "GET",
  });
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

/**
 * Fetches available suppliers filtered by categories.
 *
 * What it receives:
 *   @param {string} orderId
 *   @param {string[]} categories
 *
 * What it returns:
 *   @returns {Promise<Array<{ id, name, categories }>>}
 *
 * What it does:
 *   - Returns suppliers that match at least one category
 *
 * Why it's important:
 *   - Ensures only relevant suppliers are selectable
 */
export async function getAvailableSuppliers(categories) {
  if (USE_MOCK) {
    await mockDelay();

    if (categories?.length) {
      return MOCK_AVAILABLE_SUPPLIERS.filter((supplier) =>
        supplier.categories.some((cat) => categories.includes(cat))
      );
    }

    return MOCK_AVAILABLE_SUPPLIERS;
  }

  const params = new URLSearchParams({ categories: categories.join(",") });
  return apiFetch(`${API_BASE}/suppliers/available?${params}`);
}

/**
 * Adds suppliers to a purchase order.
 *
 * What it receives:
 *   @param {string} orderId
 *   @param {number[]} supplierIds
 *
 * What it returns:
 *   @returns {Promise<Array<{ id, name, status, quotationItems, categories }>>}
 *
 * What it does:
 *   - Assigns suppliers to the order
 *
 * Why it's important:
 *   - Enables supplier participation in the quotation process
 */
export async function addSuppliers(orderId, supplierIds) {
  if (USE_MOCK) {
    await mockDelay();

    const added = MOCK_AVAILABLE_SUPPLIERS.filter((s) =>
      supplierIds.includes(s.id)
    );

    return added.map((s) => ({
      id: s.id,
      name: s.name,
      status: "generar",
      quotationItems: [],
      categories: s.categories,
    }));
  }

  return apiFetch(`${API_BASE}/purchase-orders/${orderId}/suppliers`, {
    method: "POST",
    body: JSON.stringify({ supplierIds }),
  });
}
