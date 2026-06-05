/**
 * --------------------------------------------------------------------------
 * ItemsTable Component
 * --------------------------------------------------------------------------
 *
 * Displays all purchase request items in a table format.
 *
 * Responsibilities:
 * - Render all request items.
 * - Display product information.
 * - Display item quantities.
 * - Display category associations.
 * - Handle empty-state rendering.
 *
 * Props:
 * @param {Array<Object>} items
 *
 * Expected item structure:
 * [
 *   {
 *     id: number | string,
 *     code: string,
 *     product: string,
 *     category: string,
 *     quantity: number
 *   }
 * ]
 *
 * Behavior:
 * - Shows an empty message if no items exist.
 * - Renders a row per item.
 * - Product category is displayed as a badge.
 * - Item code uses monospace font for readability.
 *
 * Return:
 * - Empty state UI OR items table.
 * --------------------------------------------------------------------------
 */
export default function ItemsTable({ items = [] }) {

  /**
   * Empty state
   */
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 text-[14px]">
        No hay items en este pedido.
      </div>
    );
  }

  return (
    <table className="w-full text-[14px] text-slate-700">

      {/* Table header */}
      <thead className="sticky top-0 z-10 bg-background">
        <tr className="border-b border-slate-200 bg-background">

          {/* Row index */}
          <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">
            #
          </th>

          {/* Product code */}
          <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Código
          </th>

          {/* Product name */}
          <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Producto
          </th>

          {/* Category */}
          <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Categoría
          </th>

          {/* Requested quantity */}
          <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Cantidad
          </th>
        </tr>
      </thead>

      {/* Table body */}
      <tbody className="divide-y divide-slate-100">

        {items.map((item, index) => (

          /**
           * Item row
           */
          <tr
            key={item.id}
            className="hover:bg-[#F2F3F7] transition-colors"
          >

            {/* Row number */}
            <td className="px-5 py-3.5 text-slate-400 text-[13px]">
              {index + 1}
            </td>

            {/* Product internal code */}
            <td className="px-5 py-3.5 font-mono text-slate-500 text-[13px]">
              {item.code}
            </td>

            {/* Product name */}
            <td className="px-5 py-3.5 font-medium">
              {item.product}
            </td>

            {/* Product category badge */}
            <td className="px-5 py-3.5">
              <span className="px-2 py-0.5 rounded-full bg-border/60 text-muted text-xs font-medium uppercase tracking-wide">
                {item.category}
              </span>
            </td>

            {/* Requested quantity */}
            <td className="px-5 py-3.5 text-center font-medium">
              {item.quantity}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}