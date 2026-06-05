"use client";

import { useState, useEffect } from "react";
import { usePayrollProcess } from "../hooks/usePayrollProcess"; 
import { Eye, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { PayrollDetailModal } from "../components/PayrollDetailModal"; 
import { getHistoricalPayroll } from "@/lib/http/client/employees";

export default function PayrollHistoryDetailPage({ viewProcessId, onBackToList }) {
  const {
    employees,
    loading,
    error,
    isSubmitting,
    search,
    setSearch,
    startDate,
    endDate,
    runPayroll,
    selectedCount,
    totalPayrollAmount,
  } = usePayrollProcess(viewProcessId);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Inicializamos vacío y dejamos que el useEffect extraiga el estado real del DTO de Rust
  const [localState, setLocalState] = useState("");
  const [localDates, setLocalDates] = useState({ start: "", end: "" });

  // Sincronizador de metadatos basado en el nuevo PayrollSummaryDto de Rust
  useEffect(() => {
    async function syncPayrollMetadata() {
      if (!viewProcessId) return;
      try {
        const response = await getHistoricalPayroll(viewProcessId);
        const dataArray = Array.isArray(response) ? response : response?.data || response?.employees || [];
        
        if (dataArray.length > 0) {
          const firstEmp = dataArray[0];
          // Soportamos la estructura normalizada por si acaso
          const sum = firstEmp?.payrollSummary || firstEmp?.payroll_summary;
          
          if (sum) {
            // 1. EXTRAEMOS EL ESTADO REAL QUE AGREGASTE EN RUST (payroll_process_state)
            const rawState = sum.payrollProcessState || sum.payroll_process_state;
            if (rawState) {
              setLocalState(String(rawState).toUpperCase());
            }

            // 2. Extraemos la fecha del periodo
            const rawDate = sum.payrollProcessStartDate || sum.payroll_process_start_date;
            if (rawDate && typeof rawDate === "string") {
              const cleanDate = rawDate.split("T")[0];
              setLocalDates({ start: cleanDate, end: cleanDate });
            }
          }
        }
      } catch (err) {
        console.error("Error al sincronizar metadatos de la nómina:", err);
      }
    }

    syncPayrollMetadata();
  }, [viewProcessId]);

  const handlePagarHistorico = async () => {
    if (confirm("¿Está seguro de que desea registrar el pago definitivo para esta nómina histórica?")) {
      const res = await runPayroll();
      if (res.success) {
        setLocalState("PAID");
        alert("¡Pago de nómina registrado con éxito!");
      } else {
        alert(`Error: ${res.error}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-4 border-[#2b6df5] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Cargando registro histórico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl max-w-2xl mx-auto my-12 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h4 className="text-red-800 font-bold mb-1">Error al cargar la auditoría</h4>
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={onBackToList} className="mt-4 inline-flex items-center text-sm font-bold text-[#2b6df5] hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver al historial
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      
      {/* SECCIÓN 1: CABECERA / TÍTULO */}
      <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onBackToList}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Volver al historial"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Consulta de Nómina #{viewProcessId}</h2>
              
              {/* Render dinámico del Badge según el valor devuelto por Rust */}
              {localState === "PAID" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> LIQUIDADA / PAGADA
                </span>
              ) : localState === "COMPUTED" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" /> PENDIENTE DE PAGO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                  {localState || "CARGANDO..."}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Período auditado: <span className="font-semibold text-slate-700">{localDates.start || startDate || "--/--/----"}</span> al <span className="font-semibold text-slate-700">{localDates.end || endDate || "--/--/----"}</span>
            </p>
          </div>
        </div>

        {/* El botón de acción solo se renderiza si la nómina vino en estado COMPUTED */}
        {localState === "COMPUTED" && (
          <button
            type="button"
            onClick={handlePagarHistorico}
            disabled={isSubmitting || employees.length === 0}
            className="rounded-[5px] bg-[#2b6df5] px-6 py-2.5 text-[14px] font-bold text-white shadow-sm hover:bg-[#1a56db] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Procesando..." : "Generar Pago"}
          </button>
        )}
      </div>

      {/* SECCIÓN 2: FILTRO DE BÚSQUEDA */}
      <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center flex-shrink-0">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-slate-200 p-2">
          <input
            type="text"
            placeholder="Filtrar empleado por nombre o cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* SECCIÓN 3: TABLA */}
      <div className="flex-1 px-6 pb-6 pt-4 min-h-0 flex flex-col">
        <div className="flex-1 w-full rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-xs">
          
          <div className="max-h-[65vh] overflow-y-auto rounded-[5px] border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-left text-[14px] text-slate-700 border-collapse">
              <thead className="text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">Empleado</th>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">Cargo</th>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">Ingreso Bruto</th>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">Deducciones</th>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">Ingreso Neto</th>
                  <th className="sticky top-0 bg-[#f8fafc] z-10 px-6 py-3.5 font-bold shadow-[inset_0_-1px_0_rgba(226,232,240,1)] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                      No se encontraron empleados con ese criterio.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{emp.first_name} {emp.last_name}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{emp.position}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono">${Number(emp.grossIncome || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-red-500 font-mono">-${Number(emp.deductions || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">${Number(emp.netIncome || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployee(emp)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-[#2b6df5] hover:bg-slate-100 transition-all"
                          title="Ver desglose de conceptos"
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

          {/* SECCIÓN 4: TOTALIZADOR */}
          <div className="bg-[#f8fafc] border-t border-slate-200 px-6 py-4 flex items-center justify-between relative z-20 flex-shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {selectedCount} Empleados en este Registro
            </span>
            <div className="text-right">
              <span className="text-xs text-slate-500 mr-2">Total de la Nómina:</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                ${Number(totalPayrollAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL DETALLE DE INGRESOS/EGRESOS */}
      {selectedEmployee && (
        <PayrollDetailModal
          isOpen={!!selectedEmployee}
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}