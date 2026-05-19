/**
 * @file SuppliersTable.jsx
 * @module modules/purchases/purchase-requests/id/components
 *
 * @description
 * Displays the list of suppliers assigned to a purchase order with their
 * quotation status and per-row action buttons.
 */

"use client";

import { card, table, badge, label, btn } from "../styles/purchaseRequestsStyles";
import { STATUS } from "../hooks/usePurchaseRequests";

export default function SuppliersTable({
  suppliers = [],
  allGenerated = false,
  hasPrintableSuppliers = false,
  onOpenQuotation,
  onGenerateOrPrintAll,
  onOpenSupplierSearch,
}) {
  const hasSuppliers = suppliers.length > 0;

  return (
    <section className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3">
        <p className={`${label.section} mt-2`}>
          Proveedores &amp; Cotizaciones
        </p>

        <div className="flex gap-2">
          <button
            onClick={onOpenSupplierSearch}
            className="px-2 py-1 text-xs text-medium rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors shadow-panel"
          >
            + Agregar Proveedor
          </button>

          <button
            onClick={onGenerateOrPrintAll}
            disabled={!hasSuppliers}
            className={`${btn.secondarySm} shadow-panel disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {allGenerated && hasPrintableSuppliers ? "Imprimir Todos" : "Generar Todos"}
          </button>
        </div>
      </div>

      <div className={`${card.base} shadow-panel flex flex-col flex-1 min-h-0`}>
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

        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className={`${table.base} table-fixed w-full`}>
            <tbody>
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                    No hay proveedores asignados aun.
                  </td>
                </tr>
              )}

              {suppliers.map((supplier, index) => (
                <tr key={supplier.id ?? supplier.supplierId} className={table.row}>
                  <td className={`${table.tdMuted} w-8`}>
                    {index + 1}
                  </td>

                  <td className={`${table.td} font-medium`}>
                    {supplier.name}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {supplier.statusId === STATUS.CREATED ? (
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

                  <td className="px-4 py-3 text-center">
                    {(supplier.statusId === STATUS.UNSENT ||
                      supplier.statusId === STATUS.PENDING) && (
                      <span className={badge.pendiente}>• Pendiente</span>
                    )}

                    {supplier.statusId === STATUS.OK && (
                      <span className={badge.listo}>• OK</span>
                    )}

                    {supplier.statusId === STATUS.CANCELLED && (
                      <span className={badge.cancelado}>• Cancelado</span>
                    )}

                    {supplier.statusId === STATUS.CREATED && (
                      <span className={badge.pendiente}>• Sin generar</span>
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