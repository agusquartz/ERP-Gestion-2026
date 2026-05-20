/**
 * @file AnalysisTable.jsx
 * @module modules/purchases/purchase-requests/analysis/components
 *
 * @description
 * Read-only table that displays all products in a purchase request alongside
 * their currently selected supplier. Each row has an "Elegir" button that
 * opens the SelectSupplierModal for that specific product.
 *
 * ROLE IN THE PAGE:
 * This is the central UI element of AnalysisPage. It gives the user a
 * full overview of what needs to be purchased and who will supply each item.
 *
 * DATA FLOW:
 *   AnalysisPage owns selectedSuppliers state
 *     → passes it down as a prop
 *       → AnalysisTable uses it to resolve and display the supplier name per row
 *         → user clicks "Elegir" → AnalysisPage opens the modal
 *           → user picks a supplier → AnalysisPage updates selectedSuppliers
 *             → AnalysisTable re-renders with the new supplier name
 *
 * @param {Array}    details           - Purchase request detail lines.
 *                                       Each item: { product: { id, code, description,
 *                                       category: { name } }, quantity: number }
 * @param {Array}    quotes            - All QuoteResponse objects linked to this request.
 *                                       Each: { supplier: { id, name }, details: [...] }
 * @param {Object}   selectedSuppliers - Map of { [productId]: supplierId }.
 *                                       Built and managed by AnalysisPage.
 * @param {Function} onSelectSupplier  - Called with (product, requestedQty) when the
 *                                       user clicks "Elegir" on a row.
 *
 * @returns {JSX.Element} A scrollable, sticky-header table of purchase request items.
 */

"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Looks up the display name of the supplier currently selected for a product.
 *
 * We iterate through quotes rather than keeping a separate supplier lookup
 * because the supplier name is only available inside each quote's .supplier field.
 * The selectedSuppliers map only stores IDs for lightweight state.
 *
 * @param {number} productId         - The product to look up.
 * @param {Array}  quotes            - All quotes for this purchase request.
 * @param {number} selectedSupplierId - The supplierId currently chosen for this product.
 * @returns {string|null} Supplier name, or null if none is selected or found.
 */
function getSupplierName(productId, quotes, selectedSupplierId) {
  if (!selectedSupplierId) return null;

  for (const quote of quotes) {
    // Match the quote's supplier to the selected one
    if (quote.supplier?.id === selectedSupplierId) {
      // Confirm this quote actually covers the product (it should, but guard anyway)
      const detail = quote.details?.find((d) => d.productId === productId);
      if (detail) return quote.supplier.name;
    }
  }

  return null; // selected supplier found in map but not in any quote (shouldn't happen)
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AnalysisTable({ details, quotes, selectedSuppliers, onSelectSupplier }) {
  // Empty state — shown when the purchase request has no detail lines
  if (!details?.length) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        No hay productos en esta solicitud.
      </div>
    );
  }

  return (
    /*
     * Scrollable container with a max height so the table doesn't push
     * the page footer off-screen on large purchase requests.
     * rounded-[5px] matches the design border-radius spec.
     */
    <div className="max-h-[55vh] overflow-y-auto rounded-[5px] border border-slate-200">
      <table className="w-full text-[14px] text-slate-700">

        {/*
         * sticky top-0: the header row stays visible while the user scrolls
         * through many product rows, so column labels are always readable.
         * bg-background prevents row content from showing through the header.
         */}
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="border-b border-slate-200 bg-background text-[13px] font-bold text-slate-500">
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Código</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Producto</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoría</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cant. Solicitada</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proveedor</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acción</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {details.map((detail, index) => {
            const product = detail.product;

            // Look up which supplierId is selected for this product (may be undefined)
            const supplierId = selectedSuppliers[product.id];

            // Resolve the supplier's display name from the quotes array
            const supplierName = getSupplierName(product.id, quotes, supplierId);

            return (
              <tr
                key={product.id}
                className="hover:bg-[#F2F3F7] transition-colors"
              >
                {/* Row index — 1-based for readability */}
                <td className="px-4 py-3 font-medium">{index + 1}</td>

                {/* Product code — typically a SKU or internal reference */}
                <td className="px-4 py-3 text-slate-600">{product.code}</td>

                {/* Product description — full name */}
                <td className="px-4 py-3 text-slate-600">{product.description}</td>

                {/* Category badge — pill style */}
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-border/60 text-muted text-xs font-medium uppercase tracking-wide">
                    {product.category?.name ?? "-"}
                  </span>
                </td>

                {/* Quantity requested by the employee who created the purchase request */}
                <td className="px-4 py-3 text-center text-foreground">{detail.quantity}</td>

                {/*
                 * Selected supplier name column.
                 * Shows the supplier name once one is chosen (auto or manual).
                 * Shows "-" if no supplier has been selected yet for this product.
                 */}
                <td>
                  {supplierName ? (
                    <span className="px-2 py-3.5 text-slate-600">
                      {supplierName}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">-</span>
                  )}
                </td>

                {/*
                 * "Elegir" button — opens SelectSupplierModal for this product.
                 * Passes both the product object and the requested quantity so
                 * the modal can compute and display availability badges.
                 */}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onSelectSupplier(product, detail.quantity)}
                    className="px-3 py-1 rounded-[5px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors shadow-panel"
                  >
                    Elegir
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}