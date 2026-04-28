/**
 * @file OrderItemsTable.jsx
 * @module modules/purchases/components/purchase-order
 *
 * @description
 * Displays the list of products included in a purchase order.
 * Read-only table — no interactions, just data display.
 *
 * The table header is fixed and the body scrolls independently (overflow-y-auto),
 * so this section never causes the parent page to grow beyond the viewport.
 * Adjust `max-h-*` on the scroll container to control the visible row count.
 *
 * @param {Object} props
 * @param {Array}  props.items - Array of order items.
 *   Each: { id: number, code: string, product: string, category: string, quantity: number }
 *
 * @returns {JSX.Element} A bordered, scrollable table of order items.
 */


import { card, table, badge, label, } from "../../styles/purchase-order/purchaseOrderStyles";

export default function OrderItemsTable({ items = [] }) {
  
  return (
    <section className="shrink-0">
      <p className={label.section}>Items del pedido</p>

      {/* Card wrapper — rounded-[5px] matches the design border radius spec */}
      <div className={`${card.base} shadow-panel flex flex-col min-h-0`} style={{ borderRadius: "5px" }}>

        {/* Fixed header — stays visible while body scrolls */}
        <table className={`${table.base} table-fixed w-full`}>
          <thead>
            <tr className={table.head}>
              <th className={`${table.th} w-8`}>#</th>
              <th className={table.th}>Código</th>
              <th className={table.th}>Producto</th>
              <th className={table.th}>Categoría</th>
              <th className={table.thCenter}>Cantidad</th>
            </tr>
          </thead>
        </table>

        {/*
         * Scrollable body container.
         * max-h controls how many rows are visible before scrolling kicks in.
         */}
        <div className="overflow-y-auto max-h-48">
          <table className={`${table.base} table-fixed w-full`}>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                    No hay items en este pedido.
                  </td>
                </tr>
              )}
              {items.map((item, index) => (
                <tr key={item.id} className={table.row}>
                  <td className={`${table.tdMuted} w-8`}>{index + 1}</td>
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
      </div>
    </section>
  );
}
