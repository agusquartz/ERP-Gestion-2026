"use client";

export function DinamicReportTable({ reportData }) {
  // Estado de carga o si todavía no hay una consulta hecha
  if (!reportData || reportData.rows.length === 0) {
    return (
      <div className="rounded-[4px] border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-400">
        No se encontraron registros para el rango de fechas seleccionado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[4px] border border-slate-100 bg-white shadow-sm">
      <table className="w-full border-collapse text-left font-sans">
        <thead>
          <tr className="bg-[#f1f5f9] border-b border-slate-200">
            {reportData.headers.map((header) => (
              <th
                key={header}
                className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {reportData.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-slate-50/50 transition-colors"
            >
              {reportData.headers.map((header) => {
                const cellValue = row[header];

                return (
                  <td
                    key={header}
                    className="px-6 py-3.5 text-sm font-normal text-slate-700"
                  >
                    {/* Formateador rápido e inteligente: Si es un número decimal grande, le aplicamos moneda */}
                    {typeof cellValue === "number" && cellValue > 1000
                      ? `$ ${cellValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                      : cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}