"use client";
import React from 'react';
import { ActionButton } from "../../components/documents/ButtonActions";

export function InvoiceDetailsModal({ isOpen, onClose, invoice, onCreateCreditNote}) {
  if (!isOpen || !invoice) return null;
  const isInvoice = invoice.type === "Facturas";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-[15px] bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-baseline w-full p-6 border-b border-border bg-surface">
          <h2 className="text-2xl font-bold text-slate-800 ml-5">
            Detalle de Documento
          </h2>
          <h2 className="text-2xl font-bold text-[#2b6df5] mr-10">
            {isInvoice ? "Facturas" : "Nota de Crédito"} #{invoice.invoice_number || invoice.number_credite_note}
          </h2>
        </div>

        {/* BODY */}
        <div className="p-8 bg-surface">
          {/* Resumen de Datos Principales */}
          <div className="grid grid-cols-3 gap-8 mb-8  p-6 rounded-[5px]">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Cliente</p>
              <p className="text-lm font-bold text-foreground">{invoice.client}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Fecha de Emisión</p>
              <p className="text-lg font-bold text-foreground">{invoice.date}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Monto Total</p>
              <p className="text-lg font-bold text-foreground">${invoice.total?.toLocaleString()}</p>
            </div>
          </div>

          {/* Tabla de Artículos (Estilo SaleItemsTable) */}
          <div className="rounded-[5px] border border-border bg-surface shadow-panel overflow-hidden">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="bg-background">
                  <th className="border-b border-border px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Código</th>
                  <th className="border-b border-border px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Descripción</th>
                  <th className="border-b border-border px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase w-20">Cant.</th>
                  <th className="border-b border-border px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase w-28">Precio Unit.</th>
                  <th className="border-b border-border px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#f0f7ff] transition-colors">
                    <td className="px-3 py-2.5 text-sm font-medium text-foreground">{item.code}</td>
                    <td className="px-3 py-2.5 text-sm text-foreground truncate" title={item.description}>{item.description}</td>
                    <td className="px-3 py-2.5 text-sm text-center text-foreground">{item.OriginalQty}</td>
                    <td className="px-3 py-2.5 text-sm text-right text-foreground">${item.unitPrice?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-sm text-right font-bold text-foreground">
                      ${(item.OriginalQty * item.unitPrice).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t border-border bg-background p-6">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar
          </button>
          <ActionButton 
            variant="primary" 
            type="Facturas" 
            onClick={() =>{
                onClose();
                onCreateCreditNote()} }
          />
        </div>
      </div>
    </div>
  );
}