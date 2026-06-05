"use client";

import { formatCurrency } from "./utils";
import { EyeIcon } from "@/shared/components/Icons";

export function PayrollTable({
  employees,
  loading,
  error,
  excludedIds,
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
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`; // Formato amigable DD/MM/AAAA
    } catch (e) {
      return "Sin registros";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
        Cargando empleados...
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

  if (!loading && (!employees || employees.length === 0)) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
        No se encontraron empleados activos.
      </div>
    );
  }

  const allIds = employees.map((e) => e.id);
  const allSelected = excludedIds.length === 0;

  return (
    
    <div className="max-h-[50vh] overflow-y-auto rounded-[5px] border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-[14px] text-slate-700">
        <thead className="sticky top-0 z-10 bg-[#f8fafc]">
          <tr className="border-b border-slate-200 text-[13px] text-slate-500">
            <th className="px-6 py-3.5 text-left font-semibold uppercase tracking-wider">
              Empleado
            </th>
            <th className="px-6 py-3.5 text-left font-semibold uppercase tracking-wider">
              Cargo
            </th>
            {/* NUEVA COLUMNA: Encabezado */}
            <th className="px-6 py-3.5 text-center font-semibold uppercase tracking-wider">
              Último Cálculo
            </th>
            <th className="px-6 py-3.5 text-right font-semibold uppercase tracking-wider">
              Ingreso Bruto
            </th>
            <th className="px-6 py-3.5 text-right font-semibold uppercase tracking-wider">
              Deducciones
            </th>
            <th className="px-6 py-3.5 text-right font-semibold uppercase tracking-wider">
              Ingreso Neto
            </th>
            <th className="px-6 py-3.5 text-center font-semibold uppercase tracking-wider">
              Acciones
            </th>
            <th className="px-4 py-3.5 text-center font-semibold uppercase tracking-wider">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[12px]">Todos</span>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleAll(allIds)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#2b6df5] cursor-pointer"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((emp) => {
            const isExcluded = excludedIds.includes(emp.id);
            const grossIncome = emp.grossIncome ?? 0;
            const deductions = emp.deductions ?? 0;
            const netIncome = emp.netIncome ?? 0;

            return (
              <tr
                key={emp.id}
                className={`transition-colors ${
                  isExcluded
                    ? "opacity-40 bg-slate-50"
                    : "hover:bg-[#F2F3F7]/60"
                }`}
              >
                <td className="px-6 py-3.5 font-medium text-slate-900">
                  {emp.first_name} {emp.last_name}
                </td>
                <td className="px-6 py-3.5 text-slate-600">{emp.position}</td>
                
                {/* NUEVA COLUMNA: Contenido de la celda formateada */}
                <td className="px-6 py-3.5 text-center text-slate-500 text-[13px]">
                  {formatDate(emp.lastTimeComputed)}
                </td>

                <td className="px-6 py-3.5 text-right text-slate-700">
                  {formatCurrency(grossIncome)}
                </td>
                <td className="px-6 py-3.5 text-right text-slate-700">
                  {formatCurrency(deductions)}
                </td>
                <td className="px-6 py-3.5 text-right font-semibold text-slate-900">
                  {formatCurrency(netIncome)}
                </td>
                <td className="px-6 py-3.5 text-center">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-[5px] p-1.5 text-slate-500 duration-200 hover:bg-slate-100"
                    onClick={() => onView?.(emp)}
                    title="Ver detalle de pago"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={!isExcluded}
                    onChange={() => onToggleEmployee(emp.id)}
                    className="h-4 w-4 rounded border-slate-300 accent-[#2b6df5] cursor-pointer"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}