/**
 * @file SuppliersTable.jsx
 * @module modules/purchases/components/purchase-order
 *
 * @description
 * Displays the list of suppliers assigned to a purchase order along with
 * their quotation status and action buttons.
 */

import {
  card,
  table,
  badge,
  label,
  btn,
} from "../../styles/purchase-order/purchaseOrderStyles";

export default function SuppliersTable({
  suppliers = [],
  onOpenQuotation,
  onGenerateAll,
  onOpenSupplierSearch,
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className={label.section}>Proveedores &amp; Cotizaciones</p>

        <div className="flex gap-2">
          <button
            onClick={onGenerateAll}
            className={`${btn.secondarySm} shadow-panel`}
          >
            Generar Todos
          </button>

          <button
            onClick={onOpenSupplierSearch}
            className={`${btn.primarySm} shadow-panel`}
          >
            + Agregar Proveedor
          </button>
        </div>
      </div>

      <div className={`${card.base} shadow-panel`}>

        <table className={table.base}>
          <thead>
            <tr className={table.head}>
              <th className={`${table.th} w-8`}>#</th>
              <th className={table.th}>Proveedor</th>
              <th className={table.thCenter}>Cotización</th>
              <th className={table.thCenter}>Estado</th>
            </tr>
          </thead>

          <tbody>
            {suppliers.map((supplier, index) => (
              <tr key={supplier.id} className={table.row}>
                <td className={table.tdMuted}>{index + 1}</td>
                <td className={`${table.td} font-medium`}>{supplier.name}</td>

                <td className="px-4 py-3 text-center">
                  {supplier.status === "generar" ? (
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
                  {supplier.status === "pendiente" && (
                    <span className={badge.pendiente}>• Pendiente</span>
                  )}
                  {supplier.status === "listo" && (
                    <span className={badge.listo}>• Listo</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </section>
  );
}
