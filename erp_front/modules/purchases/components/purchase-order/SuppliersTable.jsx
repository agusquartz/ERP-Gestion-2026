/**
 * @file SuppliersTable.jsx
 * @module modules/purchases/components/purchase-order
 *
 * @description
 * Displays the list of suppliers assigned to a purchase order with their
 * quotation status and per-row action buttons.
 *
 * The table body is scrollable (max-h + overflow-y-auto) so the page layout
 * never grows beyond the viewport — the parent page stays fixed-height.
 *
 * Header button behavior (controlled by `allGenerated` from usePurchaseOrder):
 *   allGenerated = false → shows "Generar Todos"  (at least one supplier pending notification)
 *   allGenerated = true  → shows "Imprimir Todos" (all suppliers have been notified)
 *   The label resets to "Generar Todos" whenever a new supplier is added.
 *
 * Per-row button behavior based on supplier.status:
 *   "generar"   → "Generar" (primary blue) — opens modal for the first time
 *   "pendiente" → "Ver"     (outlined)     — opens modal with editable inputs
 *   "listo"     → "Ver"     (outlined)     — opens modal in read-only mode
 *
 * @param {Object}   props
 * @param {Array}    props.suppliers              - Supplier list from usePurchaseOrder.
 *   Each: { id: number, name: string, status: "generar"|"pendiente"|"listo", quotationItems[] }
 * @param {boolean}  props.allGenerated           - Controls the header button label.
 * @param {Function} props.onOpenQuotation        - Called with a supplier object to open QuotationModal.
 * @param {Function} props.onGenerateOrPrintAll   - Called when the header button is clicked.
 * @param {Function} props.onOpenSupplierSearch   - Called when "+ Agregar Proveedor" is clicked.
 *
 * @returns {JSX.Element} The suppliers & quotations section.
 */


import { card, table, badge, label, btn, } from "../../styles/purchase-order/purchaseOrderStyles";
import { STATUS } from "../../hooks/purchase-order/usePurchaseOrder";

export default function SuppliersTable({
  suppliers = [],
  allGenerated = false,
  onOpenQuotation,
  onGenerateOrPrintAll,
  onOpenSupplierSearch,
}) {
  return (
    <section className="flex flex-col h-full min-h-0">

      {/* ── Section header with action buttons ── */}
      <div className="flex items-center justify-between mb-3">
        <p className={label.section}>Proveedores &amp; Cotizaciones</p>

        <div className="flex gap-2">
          {/*
           * Toggle button: "Generar Todos" ↔ "Imprimir Todos"
           * - allGenerated=false → at least one supplier hasn't been notified yet
           * - allGenerated=true  → all have been notified; action is now "print"
           * Resets to "Generar Todos" when a new supplier is added (handled in the hook).
           */}
          <button
            onClick={onGenerateOrPrintAll}
            className={`${btn.secondarySm} shadow-panel`}
          >
            {allGenerated ? "Imprimir Todos" : "Generar Todos"}
          </button>

          {/* Opens SupplierSearchModal to add one or more new suppliers */}
          <button
            onClick={onOpenSupplierSearch}
            className={`${btn.primarySm} shadow-panel`}
          >
            + Agregar Proveedor
          </button>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className={`${card.base} shadow-panel flex flex-col flex-1 min-h-0`}>

        {/* Fixed header — never scrolls */}
        <table className={`${table.base} table-fixed w-full`}>
          <thead>
            <tr className={table.head}>
              <th className={`${table.th} w-8`}>#</th>
              <th className={table.th}>Proveedor</th>
              <th className={table.thCenter}>Cotización</th>
              <th className={table.thCenter}>Estado</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable body — add max-h here to control how tall the table gets */}
        <div className="overflow-y-auto max-h-48">
          <table className={`${table.base} table-fixed w-full`}>
            <tbody> 
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                    No hay proveedores asignados aun.
                  </td>
                </tr>
              )}
              {suppliers.map((supplier, index) => (
                <tr key={supplier.id} className={table.row}>
                  <td className={`${table.tdMuted} w-8`}>{index + 1}</td>
                  <td className={`${table.td} font-medium`}>{supplier.name}</td>

                  {/* Quotation action button */}
                  <td className="px-4 py-3 text-center">
                    {supplier.statusId === STATUS.UNSENT ? (
                      <button 
                        onClick={() => onOpenQuotation(supplier)}
                        className={`${btn.primarySm} shadow-panel`}
                      >
                        Generar
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenQuotation(supplier)}
                        className={`${btn.secondarySm} shadow-panel`}
                      >
                        Ver
                      </button>
                    )}
                  </td>

                  {/* Status badge — empty cell for "generar" */}
                  <td className="px-4 py-3 text-center">
                    {supplier.statusId === STATUS.PENDING && (
                      <span className={badge.pendiente}>• Pendiente</span>
                    )}
                    {supplier.statusId === STATUS.READY && (
                      <span className={badge.listo}>• Listo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
