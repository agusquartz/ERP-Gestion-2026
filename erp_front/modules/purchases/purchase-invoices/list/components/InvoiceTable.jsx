"use client";

import { getStatusStyle, formatDate } from "./utils";
import { EyeIcon } from "@/shared/components/Icons";

export function InvoiceTable({ invoices, loading, error }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
        Cargando facturas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-red-400 text-[14px]">
        {error}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
        No se encontraron facturas.
      </div>
    );
  }

  return (
    <div className="max-h-[64vh] overflow-y-auto rounded-[5px] border border-slate-200">
      <table className="w-full text-[14px] text-slate-700">
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="border-b border-slate-200 bg-background text-[13px] font-bold text-slate-500">
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Factura N°</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proveedor</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orden N°</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total $</th>
            <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
            <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((inv) => {
            const { label, color, bg, dot, border } = getStatusStyle(inv.paymentStatus);
            return (
              <tr
                key={inv.id}
                className="hover:bg-[#F2F3F7] transition-colors"
              >
                <td className="px-5 py-3.5 font-medium">{inv.invoiceNr}</td>
                {/* supplier is now an object — access .name */}
                <td className="px-5 py-3.5 text-slate-600">{inv.supplier.name}</td>
                <td className="px-5 py-3.5 text-slate-600">{inv.purchaseOrderId}</td>
                <td className="px-5 py-3.5 text-slate-600">{formatDate(inv.createdAt)}</td>
                <td className="px-5 py-3.5 text-right font-medium">
                  $ {Number(inv.total).toLocaleString("es-PY")}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`border ${border} inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1 text-[12px] font-semibold ${bg} ${color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    {label}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    className="inline-flex items-center justify-center rounded-[5px] p-1.5 text-slate-500 duration-200 hover:bg-primary/10"
                    onClick={() => console.log("ver factura", inv.id)}
                  >
                    <EyeIcon />
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