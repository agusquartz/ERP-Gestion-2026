export default function CategoriesTable({ categories = [] }) {
  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 text-[14px]">
        No hay categorías registradas.
      </div>
    );
  }

  return (
    <table className="w-full text-[14px] text-slate-700">
      <thead className="sticky top-0 z-10 bg-background">
        <tr className="border-b border-slate-200 bg-background">
          <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
          <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoría</th>
          <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Productos</th>
          <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proveedores Asig.</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {categories.map((cat, index) => (
          <tr key={cat.id ?? cat.category} className="hover:bg-[#F2F3F7] transition-colors">
            <td className="px-5 py-3.5 text-slate-400 text-[13px]">{index + 1}</td>
            <td className="px-5 py-3.5">
              <span className="px-2 py-0.5 rounded-full bg-border/60 text-muted text-xs font-medium uppercase tracking-wide">
                {cat.name ?? cat.category}
              </span>
            </td>
            <td className="px-5 py-3.5 text-center font-medium">{cat.productCount}</td>
            <td className="px-5 py-3.5 text-center font-medium">{cat.assignedSuppliers}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}