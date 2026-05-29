"use client";

import { STATUS } from "../hooks/usePurchaseRequests";

const statusConfig = {
  [STATUS.CREATED]:   { label: "Sin generar", color: "text-slate-500",  bg: "bg-slate-50",  border: "border-slate-200", dot: "bg-slate-400" },
  [STATUS.UNSENT]:    { label: "Pendiente",   color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200", dot: "bg-amber-400" },
  [STATUS.PENDING]:   { label: "Pendiente",   color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200", dot: "bg-amber-400" },
  [STATUS.OK]:        { label: "OK",          color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200", dot: "bg-green-500" },
  [STATUS.CANCELLED]: { label: "Cancelado",   color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200",   dot: "bg-red-400"  },
};

export default function SuppliersTable({
  suppliers = [],
  allGenerated = false,
  hasPrintableSuppliers = false,
  onOpenQuotation,
  onGenerateOrPrintAll,
  onOpenSupplierSearch,
}) {
  const hasSuppliers = suppliers.length > 0;

  return (
    <section className="flex flex-col min-h-0">
      {/* Encabezado de sección — fijo */}
      <div className="shrink-0 flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Proveedores &amp; Cotizaciones
        </p>
        <div className="flex gap-2">
          <button
            onClick={onOpenSupplierSearch}
            className="px-3 py-1 text-xs font-medium rounded-[5px] border border-primary text-primary hover:bg-primary/10 transition-colors"
          >
            + Agregar Proveedor
          </button>
          <button
            onClick={onGenerateOrPrintAll}
            disabled={!hasSuppliers}
            className="px-3 py-1 text-xs font-medium rounded-[5px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {allGenerated && hasPrintableSuppliers ? "Imprimir Todos" : "Generar Todos"}
          </button>
        </div>
      </div>

      {/* Tabla con scroll interno */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-[5px] border border-slate-200">
        {suppliers.length === 0 ? (
          <div className="flex items-center justify-center h-full py-10 text-slate-400 text-[14px]">
            No hay proveedores asignados aún.
          </div>
        ) : (
          <table className="w-full text-[14px] text-slate-700">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-slate-200 bg-background">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proveedor</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cotización</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((supplier, index) => {
                const status = statusConfig[supplier.statusId] ?? statusConfig[STATUS.CREATED];
                const isGenerated = supplier.statusId !== STATUS.CREATED;
                return (
                  <tr key={supplier.id ?? supplier.supplierId} className="hover:bg-[#F2F3F7] transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 text-[13px]">{index + 1}</td>
                    <td className="px-5 py-3.5 font-medium">{supplier.name}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => onOpenQuotation(supplier)}
                        className={
                          isGenerated
                            ? "inline-flex items-center justify-center rounded-[5px] border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-600 hover:bg-[#F2F3F7] transition-colors"
                            : "inline-flex items-center justify-center rounded-[5px] border border-primary bg-primary px-3 py-1 text-[12px] font-semibold text-white hover:bg-primary/90 transition-colors"
                        }
                      >
                        {isGenerated ? "Ver" : "Generar"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`border ${status.border} inline-flex items-center justify-center gap-1.5 rounded-[5px] px-3 py-1 text-[12px] font-semibold ${status.bg} ${status.color} min-w-[100px] text-center`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}