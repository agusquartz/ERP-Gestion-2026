"use client";

import { getStatusStyle, formatDate } from "./utils";
import { EyeIcon } from "@/shared/components/Icons";
import { useRouter } from "next/navigation";

export function InvoiceTable({ invoices = [], loading, error }) {
  const router = useRouter();

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full min-w-[950px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[160px]" />
            <col />
            <col className="w-[140px]" />
            <col className="w-[150px]" />
            <col className="w-[160px]" />
            <col className="w-[150px]" />
            <col className="w-[120px]" />
          </colgroup>

          <thead>
            <tr className="bg-background">
              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Factura N°
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Proveedor
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Orden N°
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fecha
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total $
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Estado
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="py-9 text-center text-sm text-muted-foreground"
                >
                  Cargando facturas...
                </td>
              </tr>
            )}

            {error && !loading && (
              <tr>
                <td
                  colSpan={7}
                  className="py-9 text-center text-sm text-red-500"
                >
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && invoices.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-9 text-center text-sm text-muted-foreground"
                >
                  No se encontraron facturas.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              invoices.map((inv) => {
                const { label, color, bg, dot, border } = getStatusStyle(
                  inv.paymentStatus
                );

                return (
                  <tr
                    key={inv.id}
                    className="group border-b border-gray-100 hover:bg-[#f0f7ff] transition-colors"
                  >
                    <td className="px-4 py-3.5 text-sm font-bold text-[#2b6df5]">
                      {inv.invoiceNr}
                    </td>

                    <td
                      className="truncate px-4 py-3.5 text-sm font-medium text-foreground"
                      title={inv.supplier?.name}
                    >
                      {inv.supplier?.name || "Sin proveedor"}
                    </td>

                    <td className="px-4 py-3.5 text-sm text-foreground">
                      {inv.purchaseOrderId}
                    </td>

                    <td className="px-4 py-3.5 text-sm text-foreground">
                      {formatDate(inv.createdAt)}
                    </td>

                    <td className="px-4 py-3.5 text-right text-sm font-bold text-foreground">
                      $ {Number(inv.total).toLocaleString("es-PY")}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-bold ${border} ${bg} ${color}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                          {label}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="inline-flex rounded-[5px] p-1 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                          onClick={() =>
                            router.push(`/purchases/purchase-invoices/${inv.id}`)
                          }
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Total facturas: {invoices.length}</span>
      </div>
    </div>
  );
}