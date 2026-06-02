"use client";

import { getStatusStyle } from "../utils";
import { EyeIcon, PenIcon } from "@/shared/components/Icons"; // Usa tus iconos compartidos existentes

export function EmployeeTable({ employees, loading, error, onEdit, onView }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
        Cargando personal...
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

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
        No se encontraron registros de empleados.
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto rounded-[5px] border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-[14px] text-slate-700">
        <thead class="sticky top-0 z-10 bg-[#f8fafc]">
          <tr className="border-b border-slate-200 text-[13px] font-bold text-slate-500">
            <th className="px-6 py-3.5 text-left font-semibold uppercase tracking-wider">Empleado</th>
            <th className="px-6 py-3.5 text-left font-semibold uppercase tracking-wider">Cargo</th>
            <th className="px-6 py-3.5 text-center font-semibold uppercase tracking-wider">Estado</th>
            <th className="px-6 py-3.5 text-center font-semibold uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((emp) => {
            const { label, color, bg, dot, border } = getStatusStyle(emp.estado);
            return (
              <tr key={emp.id} className="hover:bg-[#F2F3F7]/60 transition-colors">
                <td className="px-6 py-3.5 font-medium text-slate-900">
                  {emp.nombres} {emp.apellidos}
                </td>
                <td className="px-6 py-3.5 text-slate-600">{emp.puesto || emp.cargo}</td>
                <td className="px-6 py-3.5 text-center">
                  <span className={`border ${border} inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1 text-[12px] font-semibold ${bg} ${color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    {label}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center space-x-1">
                  <button
                    className="inline-flex items-center justify-center rounded-[5px] p-1.5 text-slate-500 duration-200 hover:bg-primary/10"
                    onClick={() => onEdit?.(emp)}
                  >
                    <PenIcon className="w-4 h-4" />
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-[5px] p-1.5 text-slate-500 duration-200 hover:bg-primary/10"
                    onClick={() => onView?.(emp)}
                  >
                    <EyeIcon className="w-4 h-4" />
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