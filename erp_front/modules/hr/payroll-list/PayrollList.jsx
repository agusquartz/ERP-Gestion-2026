"use client";

import { usePayrollHistory } from "./hook/usePayrollHistory"; // Corregido a hooks en plural
import { Eye, Layers } from "lucide-react"; 
import { useRouter } from "next/navigation";

export default function PayrollList({ onSelectProcess }) {
  const { history, loading, error } = usePayrollHistory();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-4 border-[#2b6df5] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl max-w-2xl mx-auto my-12 text-center">
        <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
      </div>
    );
  }

  const getStateBadge = (state) => {
    const s = state?.toLowerCase();
    if (s === "paid") {
      return (
        <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 border border-green-200">
          PAID
        </span>
      );
    }
    if (s === "computed") {
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
          COMPUTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
        {state?.toUpperCase()}
      </span>
    );
  };

  return (
    /* DIV BLANCO FIJO: Estructura idéntica h-[calc(100vh-140px)] para simetría total */
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      
      {/* SECCIÓN 1: CABECERA / TÍTULO */}
      <div className="p-6 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Historial de Nóminas</h1>
            <p className="text-sm text-slate-500">Registros y auditoría de cierres mensuales asentados</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: TABLA ENMARCADA POR DENTRO CON MARGEN INTERNO (px-6 pb-6 pt-6) */}
      <div className="flex-1 px-6 pb-6 pt-6 min-h-0 flex flex-col">
        {/* Recuadro propio de la tabla con bordes definidos y scroll interno independiente */}
        <div className="flex-1 w-full rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-xs">
          
          <div className="max-h-[65vh] overflow-y-auto rounded-[5px] border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-left text-[14px] text-slate-700 border-collapse">
              <thead className="text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">Id de Proceso</th>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">Fin del Periodo</th>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">Día de Pago</th>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">Tipo de Proceso</th>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)] text-center">Estado</th>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                      No hay registros históricos disponibles en este momento.
                    </td>
                  </tr>
                ) : (
                  history.map((process) => (
                    <tr key={process.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">#{process.id}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {process.cutoffDate || process.cutoff_date || "--/--/----"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono">
                        {process.payDate || process.pay_date || "--/--/----"}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 capitalize">
                        {process.processType?.toLowerCase() || process.process_type || "Mensual"}
                      </td>
                      <td className="px-6 py-4 text-center">{getStateBadge(process.state)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => router.push(`/hr/payrolls/${String(process.id)}`)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-[#2b6df5] hover:bg-slate-100 transition-all active:scale-95"
                          title="Ver detalles de la nómina"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALIZADOR / PIE DE TABLA HISTÓRICA */}
          <div className="bg-[#f8fafc] border-t border-slate-200 px-6 py-3.5 flex items-center justify-between relative z-20 flex-shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cómputos totales registrados: {history.length}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}