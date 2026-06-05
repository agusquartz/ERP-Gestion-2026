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
    "Acción"
  ];

  return (
    // CAMBIO: mismo marco visual que DocumentsTable
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      <div className="flex-1 min-h-0 overflow-auto">
        {/* CAMBIO: tabla con estilo fijo y scroll interno */}
        <table className="w-full min-w-[900px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[190px]" />
            <col className="w-[190px]" />
            <col className="w-[160px]" />
            <col className="w-[150px]" />
            <col className="w-[150px]" />
            <col className="w-[120px]" />
          </colgroup>

          <thead>
            <tr className="bg-background">
              {headers.map((h, idx) => (
                <th
                  key={h}
                  className={`sticky top-0 border-b border-border bg-background px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                    idx === 4 || idx === headers.length - 1 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {creditNotes.map((note) => (
              <tr 
                key={note.id} 
                onClick={() => onSelect(note.id)} 
                className="group border-b border-gray-100 hover:bg-[#f0f7ff] transition-colors cursor-pointer"
              >
                {/* Nota de Crédito Nº */}
                <td className="px-4 py-3.5 text-sm font-bold text-[#2b6df5] text-left">
                  {note.note_number || note.noteNr || "—"}
                </td>

                {/* Nota de Devolución Nº */}
                <td className="px-4 py-3.5 text-sm text-foreground text-left">
                  {note.return_note_id || "—"}
                </td>

                {/* Factura Nº */}
                <td className="px-4 py-3.5 text-sm text-foreground text-left">
                  {note.invoice_number || note.invoice_id || "—"}
                </td>

                {/* Fecha formateada adecuadamente */}
                <td className="px-4 py-3.5 text-sm text-foreground text-left">
                  {note.created_at 
                    ? new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                    : "—"}
                </td>

                {/* Monto con formato de moneda local */}
                <td className="px-4 py-3.5 text-sm font-bold text-foreground text-right">
                  $ {Number(note.total || 0).toLocaleString("es-PY")}
                </td>

                {/* Acción */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(note.id);
                      }}
                      className="inline-flex rounded-[5px] p-1 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {creditNotes.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="py-9 text-center text-sm text-muted-foreground">
                  No se encontraron notas de crédito.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CAMBIO: footer igual al estilo de DocumentsTable */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Total notas de crédito: {creditNotes.length}</span>
      </div>
    </div>
  );
}