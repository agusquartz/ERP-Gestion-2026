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
        const dataArray = Array.isArray(response)
          ? response
          : response?.data || response?.employees || [];

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
            const rawDate =
              sum.payrollProcessStartDate || sum.payroll_process_start_date;

            if (rawDate && typeof rawDate === "string") {
              const cleanDate = rawDate.split("T")[0];

              setLocalDates({
                start: cleanDate,
                end: cleanDate,
              });
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
    if (
      confirm(
        "¿Está seguro de que desea registrar el pago definitivo para esta nómina histórica?"
      )
    ) {
      const res = await runPayroll();

      if (res.success) {
        setLocalState("PAID");
        alert("¡Pago de nómina registrado con éxito!");
      } else {
        alert(`Error: ${res.error}`);
      }
    }
  };

  const renderStatusBadge = () => {
    if (localState === "PAID") {
      return (
        <span className="inline-flex min-w-[150px] items-center justify-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-[10px] font-bold text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          LIQUIDADA / PAGADA
        </span>
      );
    }

    if (localState === "COMPUTED") {
      return (
        <span className="inline-flex min-w-[150px] items-center justify-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-[10px] font-bold text-amber-700">
          <AlertCircle className="h-3.5 w-3.5" />
          PENDIENTE DE PAGO
        </span>
      );
    }

    return (
      <span className="inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-[10px] font-bold text-slate-700">
        {localState || "CARGANDO..."}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
        <div className="flex flex-1 flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2b6df5] border-t-transparent" />

          <p className="text-sm font-medium text-muted-foreground">
            Cargando registro histórico...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
        <div className="mx-auto my-12 max-w-2xl rounded-[5px] border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />

          <h4 className="mb-1 font-bold text-red-800">
            Error al cargar la auditoría
          </h4>

          <p className="text-sm text-red-600">{error}</p>

          <button
            onClick={onBackToList}
            className="mt-4 inline-flex items-center text-sm font-bold text-[#2b6df5] hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver al historial
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">

      <div className="mb-5 shrink-0">
        <div className="mb-3">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-1 text-sm font-medium text-secondary transition hover:text-foreground"
            title="Volver al historial"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al historial
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
                Consulta de Nómina #{viewProcessId}
              </h1>

              {renderStatusBadge()}
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Período auditado:{" "}
              <span className="font-semibold text-foreground">
                {localDates.start || startDate || "--/--/----"}
              </span>{" "}
              al{" "}
              <span className="font-semibold text-foreground">
                {localDates.end || endDate || "--/--/----"}
              </span>
            </p>
          </div>

          {localState === "COMPUTED" && (
            <button
              type="button"
              onClick={handlePagarHistorico}
              disabled={isSubmitting || employees.length === 0}
              className="rounded-[8px] bg-primary px-6 py-2.5 text-[14px] font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Procesando..." : "Generar Pago"}
            </button>
          )}
        </div>

        <div className="mt-2 h-px w-full bg-border" />
      </div>


      <div className="w-full shrink-0 space-y-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_auto] lg:items-end">
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[13px] font-bold text-slate-800">
              Búsqueda
            </label>

            <input
              type="text"
              placeholder="Filtrar empleado por nombre o cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            />
          </div>

          <button
            type="button"
            onClick={() => setSearch("")}
            className="rounded-[8px] border border-slate-300 px-6 py-2.5 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
          >
            Limpiar todo
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-[12px] text-slate-400">
            Mostrando resultados de búsqueda...
          </span>

          <span className="text-[11px] italic text-slate-400">
            Filtrá empleados por nombre o cargo.
          </span>
        </div>
      </div>

    
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1050px] table-fixed border-collapse">
            <colgroup>
              <col />
              <col className="w-[220px]" />
              <col className="w-[170px]" />
              <col className="w-[170px]" />
              <col className="w-[170px]" />
              <col className="w-[120px]" />
            </colgroup>

            <thead>
              <tr className="bg-background">
                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Empleado
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cargo
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ingreso Bruto
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Deducciones
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ingreso Neto
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-9 text-center text-sm text-muted-foreground"
                  >
                    No se encontraron empleados con ese criterio.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="group border-b border-gray-100 transition-colors hover:bg-[#f0f7ff]"
                  >
                    <td className="truncate px-4 py-3.5 text-sm font-bold text-[#2b6df5]">
                      {emp.first_name} {emp.last_name}
                    </td>

                    <td
                      className="truncate px-4 py-3.5 text-sm font-medium text-foreground"
                      title={emp.position}
                    >
                      {emp.position}
                    </td>

                    <td className="px-4 py-3.5 text-right text-sm text-foreground">
                      ${Number(emp.grossIncome || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3.5 text-right text-sm font-medium text-red-500">
                      -${Number(emp.deductions || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3.5 text-right text-sm font-bold text-foreground">
                      ${Number(emp.netIncome || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployee(emp)}
                          className="inline-flex rounded-[5px] p-1 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                          title="Ver desglose de conceptos"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CAMBIO: footer igual al estilo DocumentsTable */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{selectedCount} empleados en este registro</span>

          <div className="text-right">
            <span className="mr-2 text-xs text-muted-foreground">
              Total de la Nómina:
            </span>

            <span className="text-lg font-black text-foreground">
              ${Number(totalPayrollAmount || 0).toFixed(2)}
            </span>
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