/**
 * @file CategoriesTable.jsx
 * @module modules/purchases/components/purchase-order
 *
 * @description
 * Displays a summary of the unique product categories present in the order,
 * with a product count and an assigned-suppliers count per category.
 *
 * This table is read-only — no interactions.
 * The body is scrollable so this section never grows the page height.
 * Adjust `max-h-*` on the scroll container to control visible row count.
 *
 * @param {Object} props
 * @param {Array}  props.categories - Category summary rows from usePurchaseOrder.
 *   Each: { category: string, productCount: number, assignedSuppliers: number }
 *
 * @returns {JSX.Element} A bordered, scrollable category summary table.
 */

import { card, table, badge, label, } from "../../styles/purchase-order/purchaseOrderStyles";

export default function CategoriesTable({ categories = [] }) {
  return (
    <section className="flex flex-col min-h-0">
      <p className={label.section}>Categorias del Pedido</p>

      {/* Card wrapper — rounded-[5px] matches the design border radius spec */}
      <div className={`${card.base} shadow-panel flex flex-col min-h-0`} style={{borderRadius: "5px"}}>
        
        {/* Fixed header — stays visible while body scrolls */}
        <table className={`${table.base} table-fixed w-full`}>
          <thead>
            <tr className={table.head}>
              <th className={`${table.th} w-8`}>#</th>
              <th className={table.th}>Categoría</th>
              <th className={table.thCenter}>Productos</th>
              <th className={table.thCenter}>Proveedores Asig.</th>
            </tr>
          </thead>
        </table>
        
        {/*
         * Scrollable body container.
         * max-h controls visible rows before scroll activates.
         */}
        <div className="overflow-y-auto max-h-48">
          <table className={`${table.base} table-fixed w-full`}>
            <tbody>
              {categories.map((cat, index) => (
                <tr key={cat.category} className={table.row}>
                  <td className={`${table.tdMuted} w-8`}>{index + 1}</td>
                  <td className="px-4 py-3">
                    <span className={badge.category}>{cat.category}</span>
                  </td>
                  <td className={table.tdCenter}>{cat.productCount}</td>
                  <td className={table.tdCenter}>{cat.assignedSuppliers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}
