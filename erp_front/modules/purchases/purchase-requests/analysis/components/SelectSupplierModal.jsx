/**
 * @file SelectSupplierModal.jsx
 * @module modules/purchases/purchase-requests/analysis/components
 *
 * @description
 * Modal dialog for selecting which supplier will fulfill a specific product
 * within a purchase request analysis.
 *
 * PURPOSE:
 * When the user clicks "Elegir" on a product row in AnalysisTable, this modal
 * opens and shows all suppliers that have submitted a quotation covering that
 * product. The list is sorted cheapest-first and includes an availability badge
 * so the user can make an informed decision.
 *
 * KEY BEHAVIORS:
 * 1. AUTO-PRESELECT: On open, if there is already a selected supplier
 *    (currentSupplierId), that row is highlighted. If not, the cheapest
 *    available supplier is pre-selected as a suggestion.
 *
 * 2. ROW CLICK TO SELECT: The user can click anywhere on a supplier row
 *    to select it (not just a radio button), improving UX on touch devices.
 *
 * 3. AVAILABILITY BADGE: Each row shows a color-coded badge:
 *    - Green  "Disponible" → confirmedQuantity >= requestedQty
 *    - Yellow "Parcial"    → confirmedQuantity > 0 but < requestedQty
 *    - Red    "Sin stock"  → confirmedQuantity === 0
 *
 * 4. SORTED BY PRICE: Suppliers are always shown cheapest-first (ascending
 *    unitCost), matching the "oriented by availability and lowest price" note
 *    shown in the product info section.
 *
 * 5. EMPTY STATE: If no quote covers this product with a known price,
 *    the table body shows an informative empty message and the confirm
 *    button is disabled.
 *
 * DATA NOTES:
 * - unitCost comes from the backend as a string (Decimal serialized to JSON).
 *   We parseFloat it for numeric comparison and display with .toFixed(2).
 * - confirmedQuantity is the quantity the supplier confirmed they can provide,
 *   NOT the quantity ordered. It's used only for the availability badge here.
 *
 * @param {Object}      product           - The product being assigned a supplier.
 *                                          Shape: { id, code, description }
 * @param {number}      requestedQty      - Quantity requested in the purchase request.
 *                                          Used to compute the availability badge.
 * @param {Array}       quotes            - All QuoteResponse objects for this request.
 *                                          Each: { supplier: { id, name },
 *                                                  details: [{ productId, unitCost,
 *                                                              confirmedQuantity }] }
 * @param {number|null} currentSupplierId - The supplierId already chosen for this
 *                                          product (if any). Used to pre-highlight a row.
 * @param {Function}    onSelect          - Called with supplierId when the user confirms.
 * @param {Function}    onClose           - Called when the user cancels or closes the modal.
 *
 * @returns {JSX.Element} A fixed-position modal overlay with supplier comparison table.
 */

"use client";

import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: AvailabilityBadge
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Displays a colored pill badge indicating whether the supplier can fully
 * fulfill the requested quantity for this product.
 *
 * Thresholds:
 *   confirmed >= requested → "Disponible" (green)   — full coverage
 *   confirmed > 0          → "Parcial"    (yellow)  — partial coverage
 *   confirmed === 0        → "Sin stock"  (red)     — no coverage
 *
 * @param {number} confirmed  - Supplier's confirmed available quantity.
 * @param {number} requested  - Quantity needed from the purchase request.
 */
function AvailabilityBadge({ confirmed, requested }) {
  if (confirmed >= requested) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
        Disponible
      </span>
    );
  }
  if (confirmed > 0) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-300">
        Parcial
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
      Sin stock
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function SelectSupplierModal({
  product,
  requestedQty,
  quotes,
  currentSupplierId,
  onSelect,
  onClose,
}) {
  // Processed list of suppliers that quoted this product, sorted cheapest-first
  const [options, setOptions] = useState([]);

  // The supplierId currently highlighted/selected inside this modal
  const [selectedId, setSelectedId] = useState(null);

  // ── Effect: build the options list whenever the product or quotes change ──
  //
  // Re-runs if the modal is reused for a different product without unmounting,
  // or if the parent refreshes the quotes data.
  useEffect(() => {
    const opts = [];

    for (const quote of quotes) {
      // Find the line detail for this specific product inside this quote
      const detail = quote.details?.find((d) => d.productId === product.id);

      /*
       * Only include suppliers that:
       *   1. Have this product in their quote
       *   2. Have provided a unit cost (null = supplier didn't respond yet)
       *   3. Have a valid supplier ID
       */
      if (detail && detail.unitCost != null && quote.supplier?.id) {
        opts.push({
          supplierId: quote.supplier.id,
          supplierName: quote.supplier.name,
          // parseFloat because backend sends Decimal as string (e.g. "30.00")
          unitCost: parseFloat(detail.unitCost),
          confirmedQuantity: detail.confirmedQuantity ?? 0,
        });
      }
    }

    // Sort ascending by price so the cheapest option appears at the top
    opts.sort((a, b) => a.unitCost - b.unitCost);
    setOptions(opts);

    /*
     * Pre-selection logic:
     * - If the parent already has a supplier selected for this product,
     *   highlight that row (user is revising an existing choice).
     * - Otherwise, default to the cheapest option (index 0 after sort).
     * - If no options at all, leave selectedId as null (button stays disabled).
     */
    if (currentSupplierId) {
      setSelectedId(currentSupplierId);
    } else if (opts.length > 0) {
      setSelectedId(opts[0].supplierId);
    }
  }, [product, quotes, currentSupplierId]);

  // ── Confirm handler ───────────────────────────────────────────────────────
  //
  // Calls onSelect with the chosen supplierId, which triggers AnalysisPage to
  // update its selectedSuppliers map and close the modal.
  // Falls back to onClose if no selection was made (edge case).
  const handleConfirm = () => {
    if (selectedId) onSelect(selectedId);
    else onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    /*
     * Fixed overlay covering the entire viewport.
     * backdrop-blur-[1px] softens the background without fully obscuring it,
     * keeping the user aware of the page context behind the modal.
     */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="relative bg-surface rounded-xl w-full max-w-2xl mx-4 shadow-xl">

        {/* ── Modal header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-2xl font-bold text-foreground">Seleccionar Proveedor</h3>
          {/* Close button — top-right, accessible via keyboard and click */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        {/* ── Product info panel ────────────────────────────────────────── */}
        {/*
         * Shows context about which product is being assigned, so the user
         * doesn't have to remember what they clicked on in the table.
         * requestedQty is shown here as a reference when reading availability.
         */}
        <div className="px-6 py-4 border-b border-border bg-gray-50">
          <div className="flex items-start gap-6 flex-wrap">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Código</p>
              <p className="text-sm font-mono text-foreground mt-0.5">{product.code}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted uppercase tracking-wider">Descripción</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{product.description}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Cant. Solicitada</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{requestedQty}</p>
            </div>
          </div>
          {/* Hint text explaining the default sort order */}
          <p className="text-xs text-muted italic mt-3">
            Ordenado por disponibilidad de stock y menor precio.
          </p>
        </div>

        {/* ── Supplier comparison table ─────────────────────────────────── */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
            Selección de proveedores
          </p>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-muted text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 text-left w-8">#</th>
                  <th className="px-4 py-2 text-left">Proveedor</th>
                  <th className="px-4 py-2 text-right">Precio Unit.</th>
                  <th className="px-4 py-2 text-right">Cant. Disponible</th>
                  <th className="px-4 py-2 text-center">Disponibilidad</th>
                </tr>
              </thead>
              <tbody>
                {options.map((opt, index) => (
                  /*
                   * Entire row is clickable — better UX than a small radio button.
                   * The selected row gets a blue-50 background highlight.
                   * index 0 = cheapest (already sorted above).
                   */
                  <tr
                    key={opt.supplierId}
                    onClick={() => setSelectedId(opt.supplierId)}
                    className={`border-t border-border cursor-pointer transition-colors ${
                      selectedId === opt.supplierId
                        ? "bg-blue-50"       // currently selected row highlight
                        : "hover:bg-gray-50" // hover state for unselected rows
                    }`}
                  >
                    {/* 1-based rank (1 = cheapest) */}
                    <td className="px-4 py-3 text-muted text-xs">{index + 1}</td>

                    <td className="px-4 py-3 font-medium text-foreground">
                      {opt.supplierName}
                    </td>

                    {/* Unit cost — .toFixed(2) ensures consistent decimal display */}
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {opt.unitCost.toFixed(2)}
                    </td>

                    {/* How many units the supplier confirmed they can deliver */}
                    <td className="px-4 py-3 text-right text-foreground">
                      {opt.confirmedQuantity}
                    </td>

                    {/* Color-coded availability relative to the requested quantity */}
                    <td className="px-4 py-3 text-center">
                      <AvailabilityBadge
                        confirmed={opt.confirmedQuantity}
                        requested={requestedQty}
                      />
                    </td>
                  </tr>
                ))}

                {/* Empty state — no supplier quoted this product with a price */}
                {options.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted">
                      No hay cotizaciones disponibles para este producto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer buttons ────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          {/* Cancel — closes modal without changing the selection */}
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-gray-50 transition-colors shadow-panel"
          >
            Cancelar
          </button>

          {/*
           * Confirm — disabled when:
           *   - No option is selected (selectedId is null)
           *   - There are no options to select from (empty state)
           */}
          <button
            onClick={handleConfirm}
            disabled={!selectedId || options.length === 0}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors shadow-panel disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Seleccionar
          </button>
        </div>
      </div>
    </div>
  );
}