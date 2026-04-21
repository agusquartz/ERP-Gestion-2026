/**
 * @file CategoriesTable.jsx
 * @module modules/purchases/components/purchase-order
 *
 * @description
 * Displays a summary of unique product categories derived from the order items,
 * along with the product count per category and how many suppliers are assigned.
 */

import {
  card,
  table,
  badge,
  label,
} from "../../styles/purchase-order/purchaseOrderStyles";

export default function CategoriesTable({ categories = [] }) {
  return (
    <section>
      <p className={label.section}>Categorias del Pedido</p>

      <div className={`${card.base} shadow-panel`}>
        
        {/* Content scrolleable */}
        <table className={table.base}>
          <thead>
            <tr className={table.head}>
              <th className={`${table.th} w-8`}>#</th>
              <th className={table.th}>Categoría</th>
              <th className={table.thCenter}>Productos</th>
              <th className={table.thCenter}>Proveedores Asig.</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((cat, index) => (
              <tr key={cat.category} className={table.row}>
                <td className={table.tdMuted}>{index + 1}</td>
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
    </section>
  );
}
