// modules/purchases/purchase-requests/analysis/components/AnalysisTable.jsx
"use client";

function getSupplierName(productId, quotes, selectedSupplierId) {
  if (!selectedSupplierId) return null;
  for (const quote of quotes) {
    if (quote.supplier?.id === selectedSupplierId) {
      const detail = quote.details?.find((d) => d.productId === productId);
      if (detail) return quote.supplier.name;
    }
  }
  return null;
}

export function AnalysisTable({ details, quotes, selectedSuppliers, onSelectSupplier }) {
  if (!details?.length) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        No hay productos en esta solicitud.
      </div>
    );
  }

  return (
    <div className="max-h-[55vh] overflow-y-auto rounded-[5px] border border-slate-200  ">
      <table className="w-full text-[14px] text-slate-700">
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="border-b border-slate-200 bg-background text-[13px] font-bold text-slate-500">
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Código</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Producto</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoría</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cant. Solicitada</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proveedor</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {details.map((detail, index) => {
            const product = detail.product;
            const supplierId = selectedSuppliers[product.id];
            const supplierName = getSupplierName(product.id, quotes, supplierId);

            return (
              <tr key={product.id} className="hover:bg-[#F2F3F7] transition-colors">
                <td className="px-4 py-3 font-medium">{index + 1}</td>
                <td className="px-4 py-3 text-slate-600">{product.code}</td>
                <td className="px-4 py-3 text-slate-600">{product.description}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-border/60 text-muted text-xs font-medium uppercase tracking-wide">
                    {product.category?.name ?? "-"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-foreground">{detail.quantity}</td>
                <td>
                  {supplierName ? (
                    <span className="px-2 py-3.5 text-slate-600">
                      {supplierName}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onSelectSupplier(product, detail.quantity)}
                    className="px-3 py-1 rounded-[5px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors shadow-panel"
                  >
                    Elegir
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}