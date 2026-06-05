"use client";

import { formatCurrency } from "./utils";
import { EyeIcon } from "@/shared/components/Icons";

export function PayrollTable({
  employees = [],
  loading,
  error,
  excludedIds = [],
  onToggleEmployee,
  onToggleAll,
  onView,
}) {
  // Función para limpiar la fecha ISO (ej: 2026-06-04T16:28... -> 04/06/2026)
  const formatDate = (dateString) => {
    if (!dateString) return "Sin registros";

    try {
      const date = new Date(dateString);

      // Validamos si es una fecha válida antes de operar
      if (isNaN(date.getTime())) return "Sin registros";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`; // Formato amigable DD/MM/AAAA
    } catch (e) {
      return "Sin registros";
    }
  };

  const allIds = employees.map((e) => e.id);
  const allSelected = excludedIds.length === 0;

  return (
   
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[1150px] table-fixed border-collapse">
          <colgroup>
            <col />
            <col className="w-[180px]" />
            <col className="w-[160px]" />
            <col className="w-[160px]" />
            <col className="w-[160px]" />
            <col className="w-[160px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
          </colgroup>

          <thead>
            <tr className="bg-background">
              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Empleado
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cargo
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Último Cálculo
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ingreso Bruto
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Deducciones
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ingreso Neto
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Acción
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1.5">
                  <span>Todos</span>

                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onToggleAll(allIds)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#2b6df5]"
                  />
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="py-9 text-center text-sm text-muted-foreground"
                >
                  Cargando empleados...
                </td>
              </tr>
            )}

            {error && !loading && (
              <tr>
                <td
                  colSpan={8}
                  className="py-9 text-center text-sm text-red-500"
                >
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && employees.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-9 text-center text-sm text-muted-foreground"
                >
                  No se encontraron empleados activos.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              employees.map((emp) => {
                const isExcluded = excludedIds.includes(emp.id);
                const grossIncome = emp.grossIncome ?? 0;
                const deductions = emp.deductions ?? 0;
                const netIncome = emp.netIncome ?? 0;

                return (
                  <tr
                    key={emp.id}
                    className={`group border-b border-gray-100 transition-colors ${
                      isExcluded
                        ? "bg-slate-50 opacity-40"
                        : "hover:bg-[#f0f7ff]"
                    }`}
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

                    <td className="px-4 py-3.5 text-center text-sm text-foreground">
                      {formatDate(emp.lastTimeComputed)}
                    </td>

                    <td className="px-4 py-3.5 text-right text-sm text-foreground">
                      {formatCurrency(grossIncome)}
                    </td>

                    <td className="px-4 py-3.5 text-right text-sm text-foreground">
                      {formatCurrency(deductions)}
                    </td>

                    <td className="px-4 py-3.5 text-right text-sm font-bold text-foreground">
                      {formatCurrency(netIncome)}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="inline-flex rounded-[5px] p-1 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                          onClick={() => onView?.(emp)}
                          title="Ver detalle de pago"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={!isExcluded}
                        onChange={() => onToggleEmployee(emp.id)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#2b6df5]"
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

     
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Total empleados: {employees.length}</span>
      </div>
    </div>
  );
}