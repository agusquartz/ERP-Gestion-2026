/**
 * --------------------------------------------------------------------------
 * CategoriesTable Component
 * --------------------------------------------------------------------------
 *
 * Displays a table containing all product categories associated with
 * a purchase request.
 *
 * Responsibilities:
 * - Render category information in a structured table.
 * - Display total products per category.
 * - Display assigned suppliers per category.
 * - Handle empty states when no categories exist.
 *
 * Props:
 * @param {Array<Object>} categories
 *
 * Expected category structure:
 * [
 *   {
 *     id: number | string,
 *     name?: string,
 *     category?: string,
 *     productCount: number,
 *     assignedSuppliers: number
 *   }
 * ]
 *
 * Behavior:
 * - If the categories array is empty, an empty-state message is rendered.
 * - Otherwise, a responsive table is displayed.
 * - Each category is rendered as a row.
 * - The category name is displayed as a badge/tag.
 *
 * Return:
 * - Empty state UI OR categories table.
 * --------------------------------------------------------------------------
 */
export default function CategoriesTable({ categories = [] }) {

  /**
   * Empty state
   * Rendered when there are no categories available.
   */
  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 text-[14px]">
        No hay categorías registradas.
      </div>
    );
  }

  /**
   * Main table render
   */
  return (
    <table className="w-full text-[14px] text-slate-700">

      {/* Table Header */}
      <thead className="sticky top-0 z-10 bg-background">
        <tr className="border-b border-slate-200 bg-background">

          {/* Row index */}
          <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">
            #
          </th>

          {/* Category name */}
          <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Categoría
          </th>

          {/* Total products */}
          <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Productos
          </th>

          {/* Assigned suppliers */}
          <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Proveedores Asig.
          </th>
        </tr>
      </thead>

      {/* Table Body */}
      <tbody className="divide-y divide-slate-100">

        {categories.map((cat, index) => (

          /**
           * Each category row
           */
          <tr
            key={cat.id ?? cat.category}
            className="hover:bg-[#F2F3F7] transition-colors"
          >

            {/* Row number */}
            <td className="px-5 py-3.5 text-slate-400 text-[13px]">
              {index + 1}
            </td>

            {/* Category badge */}
            <td className="px-5 py-3.5">
              <span className="px-2 py-0.5 rounded-full bg-border/60 text-muted text-xs font-medium uppercase tracking-wide">
                {cat.name ?? cat.category}
              </span>
            </td>

            {/* Product quantity */}
            <td className="px-5 py-3.5 text-center font-medium">
              {cat.productCount}
            </td>

            {/* Assigned suppliers quantity */}
            <td className="px-5 py-3.5 text-center font-medium">
              {cat.assignedSuppliers}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}