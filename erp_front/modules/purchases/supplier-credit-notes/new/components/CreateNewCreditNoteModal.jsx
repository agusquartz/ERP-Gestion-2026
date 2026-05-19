"use client";

import { useState, useEffect } from "react";
import { s } from "../../../purchase-requests/new/styles/NewPurchasesStyles";

export default function CreateCreditNoteModal({ isOpen, onClose, returnNoteData, onSave }) {
  // Estado para las filas de la tabla (Cantidades editables)
  const [items, setItems] = useState([]);
  const [creditNoteNumber, setCreditNoteNumber] = useState("");

  // Cargar items cuando llega la data de la Nota de Devolución
  useEffect(() => {
    if (returnNoteData && returnNoteData.details) {
      const initialItems = returnNoteData.details.map((item) => ({
        ...item,
        quantityToCredit: item.quantity, // Por defecto sugerimos acreditar todo lo devuelto
        amountToCredit: item.quantity * parseFloat(item.unit_cost),
      }));
      setItems(initialItems);
    }
  }, [returnNoteData]);

  // Manejar cambio en la cantidad a acreditar
  const handleQuantityChange = (idx, value) => {
    const newItems = [...items];
    const qty = parseFloat(value) || 0;
    
    // Validación: No puede acreditar más de lo que se devolvió originalmente
    const safeQty = Math.min(qty, items[idx].quantity); 

    newItems[idx].quantityToCredit = safeQty;
    newItems[idx].amountToCredit = safeQty * parseFloat(newItems[idx].unit_cost);
    setItems(newItems);
  };

  // Cálculos de totales
  const totalFactura = items.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
  const totalAcreditar = items.reduce((acc, item) => acc + item.amountToCredit, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-[1100px] rounded-[10px] bg-[#1e293b] p-8 shadow-2xl overflow-hidden">
        
        {/* Título */}
        <h2 className={s.pageTitle}>Ingresar Nota de Crédito</h2>

        {/* Header del Formulario (Datos de Referencia) */}
        <div className="mb-8 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Nota de crédito Nº:</label>
            <input 
              type="text"
              placeholder="000-000-0000000"
              className="w-full rounded-[4px] border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              value={creditNoteNumber}
              onChange={(e) => setCreditNoteNumber(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase">Proveedor:</span>
            <p className="text-sm font-semibold text-slate-200">{returnNoteData?.supplier_name || "Marta González"}</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase">Timbrado:</span>
            <p className="text-sm font-semibold text-slate-200">{returnNoteData?.supplier_stamp || "123456789"}</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase">Orden de Compra Nº:</span>
            <p className="text-sm font-semibold text-slate-200">{returnNoteData?.oc_number || "188"}</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase">Factura Nº:</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-200">{returnNoteData?.invoice_number || "001-002-0019574"}</span>
              <button className="rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-bold text-emerald-400">Ver</button>
            </div>
          </div>

        </div>

        {/* Tabla de Items de la Factura */}
        <div className="mb-8">
          <h3 className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ÍTEMS DE LA FACTURA</h3>
          <div className="overflow-hidden rounded-[8px] border border-slate-700">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-800 text-slate-400">
                  <th className="px-4 py-3 font-bold text-center w-12">#</th>
                  <th className="px-4 py-3 font-bold">Código</th>
                  <th className="px-4 py-3 font-bold">Producto</th>
                  <th className="px-4 py-3 font-bold text-right">Precio unitario</th>
                  <th className="px-4 py-3 font-bold text-center">Cant. Facturada</th>
                  <th className="px-4 py-3 font-bold text-right">Monto Facturado</th>
                  <th className="px-4 py-3 font-bold text-center bg-blue-500/10 text-blue-400">Cant. a Acreditar</th>
                  <th className="px-4 py-3 font-bold text-right bg-blue-500/10 text-blue-400">Monto a Acreditar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-900/50">
                {items.map((item, idx) => (
                  <tr key={idx} className="text-slate-300">
                    <td className="px-4 py-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono">{item.product_code}</td>
                    <td className="px-4 py-3">{item.product_description}</td>
                    <td className="px-4 py-3 text-right">$ {parseFloat(item.unit_cost).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">$ {parseFloat(item.subtotal).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center bg-blue-500/5">
                      <input 
                        type="number" 
                        className="w-16 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-center text-sm text-white focus:border-blue-500 focus:outline-none"
                        value={item.quantityToCredit}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white bg-blue-500/5">
                      $ {item.amountToCredit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer: Totales y Acciones */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-t border-slate-700 pt-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-8">
              <span className="text-sm font-medium text-slate-400">Monto Total de la Factura:</span>
              <span className="text-lg font-bold text-slate-200">$ {totalFactura.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-sm font-medium text-slate-400">Monto Total a Acreditar:</span>
              <span className="text-2xl font-black text-blue-400">$ {totalAcreditar.toLocaleString()}</span>
            </div>
          </div>

        <div className="flex gap-4">
            <button 
            onClick={onClose}
            disabled={submitting}
            className="rounded-[4px] border border-slate-600 bg-transparent px-10 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
            Atras
            </button>
            <button 
            onClick={() => onSave({ creditNoteNumber, items, totalAcreditar })}
            disabled={submitting}
            className="rounded-[4px] bg-blue-600 px-10 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 active:scale-95 transition-all disabled:bg-blue-800 disabled:text-slate-400"
            >
            {submitting ? "Procesando..." : "Agregar Nota"}
            </button>
        </div>

        </div>

      </div>
    </div>
  );
}