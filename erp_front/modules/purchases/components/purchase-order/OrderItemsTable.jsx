/**
 * @file OrderItemsTable.jsx
 * @module modules/purchases/components/purchase-order
 *
 * @description
 * Displays the list of products included in a purchase order.
 * Read-only table — no interactions, just data display.
 */

import {
  card,
  table,
  badge,
  label,
} from "../../styles/purchase-order/purchaseOrderStyles";

export default function OrderItemsTable({ items = [] }) {
  return (
    <section className="mb-8">
      <p className={label.section}>Items del pedido</p>

      <div className={`${card.base} shadow-panel`}>
        <table className={table.base}>
          <thead>
            <tr className={table.head}>
              <th className={`${table.th} w-8`}>#</th>
              <th className={table.th}>Código</th>
              <th className={table.th}>Producto</th>
              <th className={table.th}>Categoría</th>
              <th className={table.thCenter}>Cantidad</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className={table.row}>
                <td className={table.tdMuted}>{index + 1}</td>
                <td className="px-4 py-3 font-mono text-muted text-xs">
                  {item.code}
                </td>
                <td className={table.td}>{item.product}</td>
                <td className="px-4 py-3">
                  <span className={badge.category}>{item.category}</span>
                </td>
                <td className={`${table.tdCenter} font-medium`}>
                  {item.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
