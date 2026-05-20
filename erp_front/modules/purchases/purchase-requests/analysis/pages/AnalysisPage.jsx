/**
 * @file AnalysisPage.jsx
 * @module modules/purchases/purchase-requests/analysis/pages
 *
 * @description
 * Main page for the "Quotation Analysis" step of a Purchase Request workflow.
 *
 * PURPOSE:
 * After suppliers have submitted their quotations for a purchase request,
 * this page lets the user review all products in the request and assign
 * the best supplier for each one — defaulting automatically to the cheapest
 * available supplier. Once every product has a supplier assigned, the user
 * can generate Purchase Orders grouped by supplier.
 *
 * WORKFLOW POSITION:
 *   Purchase Request → Quotations (per supplier) → [THIS PAGE] → Purchase Orders
 *
 * COMPONENT TREE:
 *   AnalysisPage
 *   ├── usePurchaseRequestAnalysis  (data fetching hook)
 *   ├── AnalysisTable               (read-only product list with supplier column)
 *   └── SelectSupplierModal         (modal to pick a supplier for one product)
 *
 * PROPS:
 * @param {string|number} requestId - The ID of the purchase request to analyze.
 *                                    Comes from the Next.js route params (e.g. params.id).
 *
 * STATE:
 * - selectedSuppliers  { [productId]: supplierId }
 *     Maps each product to the supplier currently chosen for it.
 *     Initialized automatically on data load with the cheapest supplier per product.
 *
 * - modalProduct  { product, requestedQty } | null
 *     Controls which product's supplier-selection modal is open.
 *     null = modal closed.
 *
 * - saving  boolean
 *     True while the Purchase Order POST requests are in flight.
 *
 * - generateError  string | null
 *     Error message shown below the table when order generation fails.
 *
 * DERIVED VALUES:
 * - assignedCount   Number of products that already have a supplier selected.
 * - totalCount      Total number of products in the purchase request.
 * - allAssigned     True when every product has a supplier — hides the info banner.
 *
 * SIDE EFFECTS:
 * - On data load, automatically pre-selects the cheapest supplier for every
 *   product that has at least one quotation with a unitCost value.
 * - On successful order generation, redirects to /purchases/purchase-orders.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePurchaseRequestAnalysis } from "../hooks/usePurchaseRequestAnalysis";
import { AnalysisTable } from "../components/AnalysisTable";
import { SelectSupplierModal } from "../components/SelectSupplierModal";
import { createPurchaseOrder } from "@/lib/http/client/purchase-orders";
import { InfoIcon } from "@/shared/components/Icons";

// ─────────────────────────────────────────────────────────────────────────────
// Pure helper functions (no side effects, fully testable in isolation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finds the supplierId that offers the lowest unitCost for a given product
 * across all available quotes.
 *
 * WHY parseFloat:
 *   The backend serializes Decimal fields as JSON strings (e.g. "30.00").
 *   Without parseFloat, JavaScript's < operator does lexicographic string
 *   comparison, which gives wrong results (e.g. "9" > "30").
 *
 * @param {number}  productId - The product to look up.
 * @param {Array}   quotes    - Array of QuoteResponse objects from the backend.
 * @returns {number|null} The supplierId with the lowest unitCost, or null if
 *                        no quote covers this product with a known price.
 */
function getCheapestSupplierId(productId, quotes) {
  if (!quotes?.length) return null;

  let best = null; // { supplierId, cost }

  for (const quote of quotes) {
    // Find the line item inside this quote that matches the product
    const detail = quote.details?.find((d) => d.productId === productId);

    // Skip if: product not in this quote, price unknown, or no valid supplier
    if (!detail || detail.unitCost == null || !quote.supplier?.id) continue;

    const cost = parseFloat(detail.unitCost);

    if (best === null || cost < best.cost) {
      best = { supplierId: quote.supplier.id, cost };
    }
  }

  return best?.supplierId ?? null;
}

/**
 * Builds the initial selectedSuppliers map by auto-selecting the cheapest
 * supplier for every product in the purchase request.
 *
 * Products that have no quotation with a known price are left out of the map
 * (they will show "-" in the table and require manual selection).
 *
 * @param {Array} details - Purchase request detail lines (each has .product and .quantity).
 * @param {Array} quotes  - All quotes linked to this purchase request.
 * @returns {{ [productId]: supplierId }} Initial selection map.
 */
function buildInitialSelection(details, quotes) {
  const map = {};
  for (const detail of details) {
    const id = getCheapestSupplierId(detail.product.id, quotes);
    if (id) map[detail.product.id] = id;
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalysisPage({ requestId }) {
  const router = useRouter();

  // Fetches the full purchase request aggregate (details + quotes) from the backend
  const { data, loading, error } = usePurchaseRequestAnalysis(requestId);

  // productId → supplierId: tracks which supplier is selected for each product
  const [selectedSuppliers, setSelectedSuppliers] = useState({});

  // Controls the SelectSupplierModal: null = closed, object = open for that product
  const [modalProduct, setModalProduct] = useState(null);

  // UI feedback for the "Generate Orders" action
  const [saving, setSaving] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  // ── Effect: auto-select cheapest supplier once data arrives ───────────────
  //
  // Runs once when `data` is first populated (and again if requestId changes,
  // which triggers a refetch and a new data value).
  // Resets the selection to the backend-derived cheapest option every time
  // the page loads fresh data, so stale manual selections don't carry over.
  useEffect(() => {
    if (!data?.details?.length) return;
    const initial = buildInitialSelection(data.details, data.quotes ?? []);
    setSelectedSuppliers(initial);
  }, [data]);

  // ── Handler: open the supplier-selection modal for a product ──────────────
  //
  // Receives both the product object and the requested quantity so the modal
  // can display availability information (confirmed qty vs requested qty).
  const handleOpenModal = useCallback((product, requestedQty) => {
    setModalProduct({ product, requestedQty });
  }, []);

  // ── Handler: close the modal without changing the selection ───────────────
  const handleCloseModal = useCallback(() => {
    setModalProduct(null);
  }, []);

  // ── Handler: confirm a supplier selection from the modal ──────────────────
  //
  // Updates the selectedSuppliers map for the given product and closes the modal.
  // Using functional setState ensures we always merge into the latest state,
  // even if multiple modals were somehow opened in quick succession.
  const handleSupplierSelected = useCallback((productId, supplierId) => {
    setSelectedSuppliers((prev) => ({ ...prev, [productId]: supplierId }));
    setModalProduct(null);
  }, []);

  // ── Handler: generate Purchase Orders ────────────────────────────────────
  //
  // Groups selected products by supplier, then fires one POST per supplier
  // (all in parallel with Promise.all).
  //
  // Payload shape per order:
  //   { purchaseRequestId, createdAt, supplierId, details: [{ productId, orderedQuantity }] }
  //
  // On success → navigates to the Purchase Orders list.
  // On failure → shows the error message inline.
  const handleGenerate = async () => {
    if (!data) return;

    // Build groups: { [supplierId]: [{ productId, orderedQuantity }] }
    const groups = {};
    for (const detail of data.details) {
      const productId = detail.product.id;
      const supplierId = selectedSuppliers[productId];
      if (!supplierId) continue; // skip unassigned products

      if (!groups[supplierId]) groups[supplierId] = [];
      groups[supplierId].push({ productId, orderedQuantity: detail.quantity });
    }

    // Guard: at least one product must have a supplier
    if (Object.keys(groups).length === 0) {
      setGenerateError("Debés seleccionar el proveedor para al menos un producto.");
      return;
    }

    setSaving(true);
    setGenerateError(null);
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    try {
      // Fire all order creation requests concurrently
      await Promise.all(
        Object.entries(groups).map(([supplierId, details]) =>
          createPurchaseOrder({
            purchaseRequestId: data.id,
            createdAt: today,
            supplierId: parseInt(supplierId, 10),
            details,
          })
        )
      );
      // All orders created — redirect to the orders list
      router.push("/purchases/purchase-orders");
    } catch (err) {
      setGenerateError(err.message || "Error al crear las órdenes.");
    } finally {
      setSaving(false);
    }
  };

  // ── Derived counters ──────────────────────────────────────────────────────

  // How many products already have a supplier assigned
  const assignedCount = Object.keys(selectedSuppliers).length;

  // Total products in this purchase request
  const totalCount = data?.details?.length ?? 0;

  // True when every product has been assigned — used to hide the info banner
  const allAssigned = totalCount > 0 && assignedCount === totalCount;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  // Guard: requestId is required (passed from the route)
  if (!requestId) {
    return <div className="p-6 text-sm text-red-500">ID de solicitud no proporcionado.</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-4 shrink-0">
        <h1 className="text-[30px] font-extrabold leading-none tracking-tight text-foreground md:text-[30px]">
          Análisis{" "}
          {data && (
            <span className="text-foreground">
              #PC-{String(data.id).padStart(2, "0")}
            </span>
          )}
        </h1>

        <div className="mt-4 h-px w-full bg-border" />

        {/* Requester info — shown once data loads */}
        {data && (
          <p className="text-[15px] text-foreground mt-2 border border-border rounded-[5px] pl-4 pt-1 pb-1">
            Solicitante:{" "}
            <span className="font-medium">
              {data.employee?.name} {data.employee?.surname}
            </span>
          </p>
        )}
      </div>

      {/* ── Loading state ────────────────────────────────────────────────── */}
      {loading && (
        <div className="py-4 text-sm text-muted">Cargando solicitud...</div>
      )}

      {/* ── Fetch error state ────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Main content (only rendered after data loads successfully) ────── */}
      {!loading && !error && data && (
        <>
          {/*
           * Info banner — shown when at least one product is still unassigned.
           * Guides the user to assign a supplier before generating orders.
           * Disappears automatically when allAssigned becomes true.
           */}
          {!allAssigned && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-700">
              <span className="shrink-0 mt-0.5">
                <InfoIcon />
              </span>
              <span>
                Debés seleccionar el proveedor para al menos un producto.
              </span>
            </div>
          )}

          {/*
           * Product table with supplier assignments.
           * onSelectSupplier opens the SelectSupplierModal for that row's product.
           */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <p className="block text-gray-700 text-ls font-semibold mb-2 tracking-wide">
              Ítems de la cotización — Selección de proveedores
            </p>
            <AnalysisTable
              details={data.details}
              quotes={data.quotes ?? []}
              selectedSuppliers={selectedSuppliers}
              onSelectSupplier={handleOpenModal}
            />
          </div>

          {/*
           * Counter — shows how many products have been assigned a supplier.
           * Uses padStart to always show at least 2 digits (e.g. "03").
           */}
          <p className="mt-2 text-right text-xs text-muted shrink-0">
            Proveedores: {String(assignedCount).padStart(2, "0")}
          </p>

          {/* Inline error from a failed order-generation attempt */}
          {generateError && (
            <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 shrink-0">
              {generateError}
            </div>
          )}

          {/*
           * Footer action buttons.
           * "Atrás" goes back one step in the browser history.
           * "Generar" is disabled while saving or if no supplier is assigned.
           */}
          <div className="mt-4 flex justify-end gap-3 shrink-0">
            <button
              onClick={() => router.back()}
              className="px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-[#F2F3F7] transition-colors shadow-panel"
            >
              Atrás
            </button>
            <button
              onClick={handleGenerate}
              disabled={saving || assignedCount === 0}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors shadow-panel disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Generando..." : "Generar"}
            </button>
          </div>
        </>
      )}

      {/*
       * SelectSupplierModal — rendered outside the conditional block so it can
       * animate out smoothly. Only visible when modalProduct is not null.
       */}
      {modalProduct && data && (
        <SelectSupplierModal
          product={modalProduct.product}
          requestedQty={modalProduct.requestedQty}
          quotes={data.quotes ?? []}
          currentSupplierId={selectedSuppliers[modalProduct.product.id]}
          onSelect={(supplierId) =>
            handleSupplierSelected(modalProduct.product.id, supplierId)
          }
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}