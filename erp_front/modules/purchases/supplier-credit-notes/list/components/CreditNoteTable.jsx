"use client";

export function CreditNoteTable({ creditNotes = [], onSelect, onView }) {
  const headers = [
    "Nota de Crédito Nº", 
    "Nota de Devolución Nº", 
    "Factura Nº", 
    "Fecha", 
    "Monto", 
    "Accion"
  ];

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-white">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="bg-[#DBE3EE]">
              {headers.map((h, idx) => (
                <th
                  key={h}
                  className={`sticky top-0 border-b border-slate-100 bg-[#DBE3EE] px-4 py-1 text-[13px] font-bold text-[#374151] ${
                    idx === headers.length - 1 ? "text-center w-24" : "text-left"
                  } ${
                    // 2. Redondeamos la esquina superior izquierda del primer th
                    idx === 0 ? "rounded-tl-[8px]" : ""
                  } ${
                    // 3. Redondeamos la esquina superior derecha del último th
                    idx === headers.length - 1 ? "rounded-tr-[8px]" : ""
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
                onClick={() => onSelect && onSelect(note.id)} 
                className="group border-b border-slate-50 hover:bg-[#f4f8ff] transition-colors cursor-pointer"
              >
                {/* Nota de Crédito Nº */}
                <td className="px-4 py-3.5 text-[14px] text-slate-700">
                  {note.credit_note_number}
                </td>

                {/* Nota de Devolución Nº */}
                <td className="px-4 py-3.5 text-[14px] text-slate-700">
                  {note.return_note_number || "—"}
                </td>

                {/* Factura Nº */}
                <td className="px-4 py-3.5 text-[14px] text-slate-700">
                  {note.invoice_number}
                </td>

                {/* Fecha */}
                <td className="px-4 py-3.5 text-[14px] text-slate-600">
                  {note.date}
                </td>

                {/* Monto */}
                <td className="px-4 py-3.5 text-[14px] text-slate-800">
                  $ {note.amount}
                </td>

                {/* Acción */}
                <td className="px-4 py-3.5 text-center">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(note.id);
                      }}
                      className="inline-flex rounded-[5px] p-1 text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-[#2b6df5]"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="w-5 h-5"
                      >
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {creditNotes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
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