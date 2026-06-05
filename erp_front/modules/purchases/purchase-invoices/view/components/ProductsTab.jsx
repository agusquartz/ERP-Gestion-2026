"use client";

// "Productos" tab — shows the line items of the invoice.
// Columns: #, Code, Description, Category, Quantity, Price, Sub Total
export function ProductsTab({ invoice, loading, error }) {
    // --- Loading state: show centered message while fetching products ---
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
                Cargando productos...
            </div>
        );
    }

    // --- Error state: display error message if something went wrong ---
    if (error) {
        return (
            <div className="flex items-center justify-center py-20 text-red-400 text-[14px]">
                {error}
            </div>
        );
    }

    // Extract the details array from invoice (default to empty array if not present)
    const details = invoice?.details ?? [];

    // --- Empty state: no product lines registered for this invoice ---
    if (details.length === 0) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
                No hay productos registrados.
            </div>
        );
    }

    return (
        // Fixed height container with border and rounded corners, using flex column to contain table
        <div className="h-[61vh] flex flex-col rounded-[5px] border border-slate-200">
            <table className="w-full text-[14px] text-slate-700">
                {/* Table header: styled with background, uppercase, tracking, and specific alignments */}
                <thead>
                    <tr className="border-b border-slate-200 bg-background">
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Código</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripción</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoría</th>
                        <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cantidad</th>
                        <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Precio</th>
                        <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtotal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {/* Map over each product detail item, index i for row number */}
                    {details.map((item, i) => (
                        <tr key={item.product.id} className="hover:bg-[#F2F3F7] transition-colors">
                            {/* Row number (1-based) */}
                            <td className="px-5 py-3.5 text-slate-400">{i + 1}</td>
                            {/* Product code */}
                            <td className="px-5 py-3.5 font-medium">{item.product.code}</td>
                            {/* Product description / name */}
                            <td className="px-5 py-3.5 text-slate-600">{item.product.name}</td>
                            {/* Product category name (nested object) */}
                            <td className="px-5 py-3.5 text-slate-600">{item.product.category.name}</td>
                            {/* Quantity (right-aligned) */}
                            <td className="px-5 py-3.5 text-right">{item.quantity}</td>
                            {/* Unit cost formatted as currency with es-PY locale */}
                            <td className="px-5 py-3.5 text-right">
                                $ {Number(item.unitCost).toLocaleString("es-PY")}
                            </td>
                            {/* Subtotal (quantity * unitCost) formatted as currency */}
                            <td className="px-5 py-3.5 text-right font-medium">
                                $ {Number(item.subtotal).toLocaleString("es-PY")}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}