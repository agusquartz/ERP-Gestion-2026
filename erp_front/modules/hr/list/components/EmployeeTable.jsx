"use client";

import { getStatusStyle } from "./utils";
import { EyeIcon } from "@/shared/components/Icons";

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

  if (!loading && (!employees || employees.length === 0)) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
        No se encontraron registros de empleados.
      </div>
    );
  }

  return (
    <div className="max-h-[65vh] overflow-y-auto rounded-[5px] border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-[14px] text-slate-700">
        <thead className="sticky top-0 z-10 bg-[#f8fafc]">
          <tr className="border-b border-slate-200 text-[13px] font-bold text-slate-500">
            <th className="px-6 py-3.5 text-left font-semibold uppercase tracking-wider">Empleado</th>
            <th className="px-6 py-3.5 text-left font-semibold uppercase tracking-wider">Cargo / Puesto</th>
            <th className="px-6 py-3.5 text-center font-semibold uppercase tracking-wider">Estado</th>
            <th className="px-6 py-3.5 text-center font-semibold uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((emp) => {
            
            // CONTROL DE SEGURIDAD: Si emp.status no existe o no es válido,
            // le pasamos "active" por defecto para evitar que la app crashee.
            const currentStatus = emp.status === "active" || emp.status === "inactive" 
              ? emp.status 
              : "active";

            // Ahora invocamos de manera segura la función de utilidades
            const { label, color, bg, dot, border } = getStatusStyle(currentStatus);

            return (
              <tr key={emp.id} className="hover:bg-[#F2F3F7]/60 transition-colors">
                <td className="px-6 py-3.5 font-medium text-slate-900">
                  {emp.first_name} {emp.last_name}
                </td>
                <td className="px-6 py-3.5 text-slate-600">{emp.position}</td>
                <td className="px-6 py-3.5 text-center">
                  <span className={`border ${border} inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1 text-[12px] font-semibold ${bg} ${color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    {label}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center space-x-1">
                  {/* BOTÓN EDITAR: */}
                  <button
                    className="inline-flex items-center justify-center rounded-[5px] p-1.5 text-slate-500 duration-200 hover:bg-slate-100"
                    onClick={() => onEdit?.(emp)}
                    title="Editar empleado"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
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