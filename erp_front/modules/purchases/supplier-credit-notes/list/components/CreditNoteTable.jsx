"use client";

import { EyeIcon } from "@/shared/components/Icons";

// Agregamos funciones vacías por defecto (() => {}) a onSelect y onView para evitar crasheos si se olvidan de pasarlas
export function CreditNoteTable({ creditNotes = [], onSelect = () => {}, onView = () => {} }) {
  const headers = [
    "Nota de Crédito Nº", 
    "Nota de Devolución Nº", 
    "Factura Nº", 
    "Fecha", 
    "Monto", 
    "Accion"
  ];

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-white rounded-[5px] border border-slate-200">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="bg-[#DBE3EE]">
              {headers.map((h, idx) => (
                <th
                  key={h}
                  className={`sticky top-0 border-b border-slate-100 bg-[#DBE3EE] px-5 py-3 text-[13px] font-bold text-[#374151] ${
                    idx === headers.length - 1 ? "text-center w-24" : "text-left"
                  } ${
                    idx === 4 ? "text-right" : ""
                  } ${
                    idx === 0 ? "rounded-tl-[5px]" : ""
                  } ${
                    idx === headers.length - 1 ? "rounded-tr-[5px]" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white text-[14px]">
            {creditNotes.map((note) => (
              <tr 
                key={note.id} 
                onClick={() => onSelect(note.id)} 
                className="group border-b border-slate-50 hover:bg-[#F2F3F7] transition-colors cursor-pointer"
              >
                {/* Nota de Crédito Nº */}
                <td className="px-5 py-3.5 font-medium text-slate-900">
                  {note.note_number || note.noteNr || "—"}
                </td>

                {/* Nota de Devolución Nº */}
                <td className="px-5 py-3.5 text-slate-600">
                  {note.return_note_id || "—"}
                </td>

                {/* Factura Nº */}
                <td className="px-5 py-3.5 text-slate-600">
                  {note.invoice_number || note.invoice_id || "—"}
                </td>

                {/* Fecha formateada adecuadamente */}
                <td className="px-5 py-3.5 text-slate-600">
                  {note.created_at 
                    ? new Date(note.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) 
                    : "—"}
                </td>

                {/* Monto con formato de moneda local */}
                <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                  $ {Number(note.total || 0).toLocaleString("es-PY")}
                </td>

                {/* Acción */}
                <td className="px-5 py-3.5 text-center">
                  <div className="flex justify-center">
                  <button
                  type="button"
                  onClick={(e) => {
                  e.stopPropagation();
                  onView(note.id);
                  }}
                  className="inline-flex rounded-[5px] p-1.5 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-[#2b6df5]"
                  >
                  <EyeIcon className="w-5 h-5" />
                  </button>
                  </div>
                </td>
              </tr>
            ))}

            {creditNotes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-20 text-center text-sm text-slate-400">
                  No se encontraron notas de crédito.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}