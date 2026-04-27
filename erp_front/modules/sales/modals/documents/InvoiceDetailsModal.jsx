"use client";
import React from 'react';
import { ActionButton } from "../../components/documents/ButtonActions";

export function InvoiceDetailsModal({ isOpen, onClose, invoice }) {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-[15px] bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* HEADER: Siguiendo tu estilo de títulos a los extremos */}
        <div className="flex justify-between items-baseline w-full p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 ml-5">
            Detalle de Documento
          </h2>
          <h2 className="text-2xl font-bold text-[#2b6df5] mr-10">
            {invoice.type === "Facturas" ? "Factura" : "Nota de Crédito"} #{invoice.invoice_number || invoice.number_credite_note}
          </h2>
        </div>

        {/* BODY */}
        <div className="p-8">
          {/* Resumen de Datos Principales */}
          <div className="grid grid-cols-3 gap-8 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente</p>
              <p className="text-lg font-bold text-slate-700">{invoice.client}</p>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha de Emisión</p>
              <p className="text-lg font-bold text-slate-700">{invoice.date}</p>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monto Total</p>
              <p className="text-lg font-bold text-slate-900">${invoice.total?.toLocaleString()}</p>
            </div>
          </div>

          {/* Tabla de Artículos */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-center text-[13px] font-bold text-slate-500 uppercase">Cant.</th>
                  <th className="px-4 py-3 text-right text-[13px] font-bold text-slate-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-3 text-right text-[13px] font-bold text-slate-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 text-sm font-medium text-slate-600">{item.code}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{item.description}</td>
                    <td className="px-4 py-4 text-sm text-center text-slate-600">{item.OriginalQty}</td>
                    <td className="px-4 py-4 text-sm text-right text-slate-600">${item.unitPrice?.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-right font-bold text-slate-800">
                      ${(item.OriginalQty * item.unitPrice).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cerrar
          </button>
          <ActionButton 
            variant="primary" 
            type="guardar" // Reutiliza tu lógica que dice "Guardar" o podrías crear "Imprimir"
            onClick={() => window.print()} 
          />
        </div>
      </div>
    </div>
  );
}