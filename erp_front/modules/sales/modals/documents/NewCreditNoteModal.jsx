
"use client";
/* ============================================================
   NEW CREDIT NOTE MODAL

   Modal used to create a new credit note from a selected invoice.
   It displays the invoice number, renders the invoice items table,
   and provides actions to cancel or generate the credit note.
   ============================================================ */

import { NewCreditNoteTable } from "./NewCreditNoteTable";
import { ActionButton } from "../../components/documents/ButtonActions";

export function NewCreditNoteModal({ isOpen, onClose, invoiceNumber, items}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-[15px] shadow-2xl">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Nueva Nota de Crédito</h2>
            <p className="text-sm text-slate-500">Factura seleccionada: ID #{invoiceNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <NewCreditNoteTable items={items} />
        </div>

      
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-[8px] font-bold text-[14px] text-slate-500 hover:bg-slate-100 transition-all"
          >
            Cancelar
          </button>
          <ActionButton 
            variant="primary" 
            type="Facturas" 
            onClick={() => {
              alert("Nota de Crédito Generada");
              onClose();
            }} 
          />
        </div>
      </div>
    </div>
  );
}