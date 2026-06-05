"use client";

import { getStatusStyle } from "./utils";

export function EmployeeTable({ employees = [], loading, error, onEdit, onView }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[760px] table-fixed border-collapse">
          <colgroup>
            <col />
            <col className="w-[260px]" />
            <col className="w-[150px]" />
            <col className="w-[130px]" />
          </colgroup>

          <thead>
            <tr className="bg-background">
              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Empleado
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cargo / Puesto
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Estado
              </th>

              <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={4}
                  className="py-9 text-center text-sm text-muted-foreground"
                >
                  Cargando personal...
                </td>
              </tr>
            )}

            {error && !loading && (
              <tr>
                <td
                  colSpan={4}
                  className="py-9 text-center text-sm text-red-500"
                >
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && employees.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-9 text-center text-sm text-muted-foreground"
                >
                  No se encontraron registros de empleados.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              employees.map((emp) => {
                // CONTROL DE SEGURIDAD: Si emp.status no existe o no es válido,
                // le pasamos "active" por defecto para evitar que la app crashee.
                const currentStatus =
                  emp.status === "active" || emp.status === "inactive"
                    ? emp.status
                    : "active";

                // Ahora invocamos de manera segura la función de utilidades
                const { label, color, bg, dot, border } =
                  getStatusStyle(currentStatus);

                return (
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
                        {/* BOTÓN EDITAR */}
                        <button
                          type="button"
                          className="inline-flex rounded-[5px] p-1 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                          onClick={() => onEdit?.(emp)}
                          title="Editar empleado"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* CAMBIO: footer igual al estilo de DocumentsTable */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Total empleados: {employees.length}</span>
      </div>
    </div>
  );
}