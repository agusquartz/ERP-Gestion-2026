"use client";

import { getStatusStyle, formatDate } from "./utils";
import { EyeIcon } from "@/shared/components/Icons"

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
    <div className="overflow-x-auto rounded-[12px] border border-slate-200">
      <table className="w-full text-[14px] text-slate-700">
        <thead>
          <tr className="border-b border-slate-200 bg-[#f8fafc] text-[13px] font-bold text-slate-500">
            <th className="px-5 py-3.5 text-left">Factura N°</th>
            <th className="px-5 py-3.5 text-left">Proveedor</th>
            <th className="px-5 py-3.5 text-left">Orden N°</th>
            <th className="px-5 py-3.5 text-left">Fecha</th>
            <th className="px-5 py-3.5 text-right">Total $</th>
            <th className="px-5 py-3.5 text-center">Estado</th>
            <th className="px-5 py-3.5 text-center">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((inv) => {
            const { label, color, bg, dot } = getStatusStyle(inv.payment_status);
            return (
              <tr
                key={inv.id}
                className="hover:bg-[#f8fafc] transition-colors"
              >
                <td className="px-5 py-3.5 font-medium">{inv.invoice_nr}</td>
                <td className="px-5 py-3.5 text-slate-600">{inv.supplier_name}</td>
                <td className="px-5 py-3.5 text-slate-600">{inv.purchase_order_id}</td>
                <td className="px-5 py-3.5 text-slate-600">{formatDate(inv.created_at)}</td>
                <td className="px-5 py-3.5 text-right font-medium">
                  $ {inv.total}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${bg} ${color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    {label}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    className="inline-flex items-center justify-center rounded-[6px] border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-[#2b6df5] transition-colors"
                    onClick={() => console.log("ver factura", inv.id)} // ← replace this later
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