"use client";
import { EyeIcon } from "@/shared/components/Icons";

export function DocumentsTable({ documents = [], onSelect, onView, type = "Factura" }) {
  const columnConfig = {
    "Facturas": ["Fecha", "Nro. Factura", "Cliente", "Total", "Acción"],
    "Presupuesto": ["Fecha", "Nro. Presupuesto", "Cliente", "Estado", "Total", "Acción"],
    "Notas de Credito": ["Fecha", "Nro. Nota Credito", "Nro. Factura", "Cliente", "Total", "Acción"]
  };

  const headers = columnConfig[type] || columnConfig["Facturas"];

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-background">
              {headers.map((h) => (
                <th
                  key={h}
                  className="sticky top-0 border-b border-border bg-background px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {documents.map((doc) => (
              <tr 
                key={doc.id} 
                onClick={() => onSelect(doc.id)} 
                className="group border-b border-gray-100 hover:bg-[#f0f7ff] transition-colors cursor-pointer"
              >
                <td className="px-3 py-2.5 text-sm text-foreground">{doc.date}</td>
                
                {type === "Notas de Credito" && (
                  <td className="px-3 py-2.5 text-sm font-bold text-foreground">
                    {doc.number_credite_note}
                  </td>
                )}

                <td className="px-3 py-2.5 text-sm font-bold text-[#2b6df5]">
                  {doc.invoice_number}
                </td>

                <td className="truncate px-3 py-2.5 text-sm text-foreground font-medium" title={doc.client}>
                  {doc.client}
                </td>

                {type === "Presupuesto" && (
                  <td className="px-3 py-2.5 text-sm">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
                      {doc.status || 'Pendiente'}
                    </span>
                  </td>
                )}

                <td className="px-3 py-2.5 text-sm font-bold text-foreground">
                  ${doc.total?.toLocaleString()}
                </td>

                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(doc.id);
                    }}
                    className="inline-flex rounded-[5px] p-1 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}

            {documents.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="py-9 text-center text-sm text-muted-foreground">
                  No hay {type.toLowerCase()} disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer opcional para mantener la simetría de altura con la otra tabla */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Total {type}: {documents.length}</span>
      </div>
    </div>
  );
}