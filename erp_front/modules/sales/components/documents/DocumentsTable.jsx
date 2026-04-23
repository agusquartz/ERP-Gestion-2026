"use client";
import { TrashIcon } from "@/shared/components/Icons";

export function DocumentsTable({ documents = [], onSelect, onRemove, type = "Factura" }) {
  

  const columnConfig = {
    "Facturas": ["Fecha", "Nro. Factura", "Cliente", "Total", "Acción"],
    "Presupuesto": ["Fecha", "Nro. Factura", "Cliente", "Estado", "Total", "Acción"],
    "Notas de Credito": ["Fecha", "Nro. Nota Credito", "Nro. Factura", "Categoria", "Cliente", "Total", "Acción"]
  };

  const headers = columnConfig[type] || columnConfig["Facturas"];

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              {headers.map((h) => (
                <th
                  key={h}
                  className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} 
                  onClick = {() => onSelect(doc.id)} 
                  
                  className="group border-b border-slate-50 hover:bg-[#f0f7ff] transition-colors">
                
                <td className="px-4 py-3.5 text-[14px] text-slate-600 font-medium">{doc.fecha}</td>
                
             
                {type === "Notas de Credito" && (
                  <td className="px-4 py-3.5 text-[14px] font-bold text-slate-700">{doc.numeroNotaCredito}</td>
                )}

            
                <td className="px-4 py-3.5 text-[14px] font-bold text-[#2b6df5]">{doc.numeroFactura}</td>

          
                {type === "Notas de Credito" && (
                  <td className="px-4 py-3.5 text-[14px] text-slate-600 italic">{doc.categoria}</td>
                )}

                <td className="truncate px-4 py-3.5 text-[14px] text-slate-700 font-semibold">{doc.cliente}</td>

        
                {type === "Presupuesto" && (
                  <td className="px-4 py-3.5 text-[14px]">
                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-[12px] font-bold uppercase">
                      {doc.estado || 'Pendiente'}
                    </span>
                  </td>
                )}

            
                <td className="px-4 py-3.5 text-[14px] font-bold text-slate-900">${doc.total?.toLocaleString()}</td>

             
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => onRemove(doc.id)}
                    className="inline-flex rounded-[8px] p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}

            {documents.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="py-12 text-center text-[14px] text-slate-400">
                  No hay {type.toLowerCase()} disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}