"use client";

import { usePayrollHistory } from "./hook/usePayrollHistory";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PayrollList({ onSelectProcess }) {
  const { history, loading, error } = usePayrollHistory();
  const router = useRouter();

  const getStateBadge = (state) => {
    const s = state?.toLowerCase();

    if (s === "paid") {
      return (
        <span className="inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-[10px] font-bold text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          PAID
        </span>
      );
    }

    if (s === "computed") {
      return (
        <span className="inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-[10px] font-bold text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          COMPUTED
        </span>
      );
    }

    return (
      <span className="inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-[10px] font-bold text-slate-700">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {state?.toUpperCase() || "SIN ESTADO"}
      </span>
    );
  };

  return (
    // CAMBIO: contenedor principal estilo DocumentsPage
    <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
      {/* CAMBIO: header principal estilo DocumentsPage */}
      <div className="mb-5 shrink-0">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
          Historial de Nóminas
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Consultá registros y auditoría de cierres mensuales asentados.
        </p>

        <div className="mt-2 h-px w-full bg-border" />
      </div>

      {/* CAMBIO: tabla estilo DocumentsTable */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[950px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[160px]" />
              <col className="w-[170px]" />
              <col className="w-[170px]" />
              <col />
              <col className="w-[150px]" />
              <col className="w-[120px]" />
            </colgroup>

            <thead>
              <tr className="bg-background">
                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Id de Proceso
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fin del Periodo
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Día de Pago
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo de Proceso
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-9 text-center text-sm text-muted-foreground"
                  >
                    Cargando historial...
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-9 text-center text-sm text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && history.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-9 text-center text-sm text-muted-foreground"
                  >
                    No hay registros históricos disponibles en este momento.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                history.map((process) => (
                  <tr
                    key={process.id}
                    className="group border-b border-gray-100 transition-colors hover:bg-[#f0f7ff]"
                  >
                    <td className="px-4 py-3.5 text-sm font-bold text-[#2b6df5]">
                      #{process.id}
                    </td>

                    <td className="px-4 py-3.5 text-sm text-foreground">
                      {process.cutoffDate || process.cutoff_date || "--/--/----"}
                    </td>

                    <td className="px-4 py-3.5 text-sm text-foreground">
                      {process.payDate || process.pay_date || "--/--/----"}
                    </td>

                    <td className="truncate px-4 py-3.5 text-sm font-medium capitalize text-foreground">
                      {process.processType?.toLowerCase() ||
                        process.process_type ||
                        "Mensual"}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center">
                        {getStateBadge(process.state)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/hr/payrolls/${String(process.id)}`)
                          }
                          className="inline-flex rounded-[5px] p-1 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                          title="Ver detalles de la nómina"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* CAMBIO: footer igual al estilo de DocumentsTable */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>Cómputos totales registrados: {history.length}</span>
        </div>
      </div>
    </div>
  );
}