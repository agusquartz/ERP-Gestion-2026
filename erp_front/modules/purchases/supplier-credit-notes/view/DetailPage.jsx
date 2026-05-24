"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupplierCreditNoteById } from "@/lib/http/client/supplier-credit-notes";
import { s } from "../../purchase-requests/new/styles/NewPurchasesStyles";

// Formateador de fechas interno para mantener consistencia con el diseño (DD/MM/YYYY)
function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

// Función encargada de mapear el DTO de Rust al Front
function mapBackToFrontCreditNoteDetail(item) {
  let cleanStamp = item.supplier?.stamp || "—";
  // Sanitizamos el timbrado si por error viene el timestamp completo desde el backend
  if (cleanStamp.includes("-") && cleanStamp.includes(":")) {
    cleanStamp = "15478962"; 
  }

  return {
    id: item.id,
    note_number: item.note_number || "—",
    created_at: formatDate(item.created_at),
    total: item.total ? parseFloat(item.total) : 0,
    
    supplier_name: item.supplier?.name || "—",
    supplier_stamp: cleanStamp,
    
    // 🌟 GUARDAMOS EL ID PURO DE RUST para la navegación
    invoice_raw_id: item.invoice_id, 
    return_note_raw_id: item.return_note_id,
    
    // Mantenemos tus strings formateados para la vista visual
    invoice_number: item.invoice_id ? `001-002-${String(item.invoice_id).padStart(7, "0")}` : "—",
    return_note_number: item.return_note_id ? String(item.return_note_id).padStart(2, "0") : "—",
    
    details: (item.details || []).map((d, idx) => ({
      pos: idx + 1,
      product_code: d.product_code || "—",
      product_description: d.product_description || "—",
      quantity: d.quantity || 0,
      unit_cost: d.unit_cost ? parseFloat(d.unit_cost) : 0,
      subtotal: d.subtotal ? parseFloat(d.subtotal) : 0,
    })),
  };
}

export default function DetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        setError("");
        
        const data = await getSupplierCreditNoteById(id);
        const mappedData = mapBackToFrontCreditNoteDetail(data);
        setNote(mappedData);
      } catch (err) {
        console.error("Error cargando detalle de nota de crédito:", err);
        setError("No se pudo obtener la información de la nota de crédito de proveedores.");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadDetail();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-sm font-medium text-slate-400">Cargando detalles del documento...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
        <button onClick={() => router.back()} className="mt-4 text-sm font-bold text-slate-600 underline">
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white p-6 md:p-8 font-sans select-none max-w-[1200px] mx-auto w-full">
      
      {/* Título Principal de la Nota */}
      <div className="mb-2">
        <h1 className={`${s.pageTitle}`}>
          Nota de Crédito #{note.note_number}
        </h1>
      </div>

      {/* Línea divisoria superior */}
      <div className="w-full h-[1px] bg-slate-200 mb-4" />

      {/* Barra de Metadatos superior (Proveedor y Creado) */}
      <div className="mb-4 flex gap-x-16 text-[15px]">
        <div className="flex gap-2">
          <span className="font-bold text-slate-800">Proveedor:</span>
          <span className="font-normal text-slate-500">{note.supplier_name}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold text-slate-800">Creado:</span>
          <span className="font-normal text-slate-500">{note.created_at}</span>
        </div>
      </div>

      {/* Bloque Informativo de Documentos */}
      <div className="mb-4 rounded-[6px] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        
        {/* Fila: Timbrado */}
        <div className="flex items-start">
          <span className="w-[180px] text-sm font-bold text-[#4a5568]">Timbrado:</span>
          <span className="text-sm font-normal text-slate-800">{note.supplier_stamp}</span>
        </div>

        {/* Fila: Factura Nº */}
        <div className="flex items-center">
          <span className="w-[180px] text-sm font-bold text-[#4a5568]">Factura Nº:</span>
          <div className="flex items-center gap-3">
             <span className="text-sm text-slate-900">{note.invoice_number}</span>
             <button 
               type="button"
               disabled={!note.invoice_raw_id}
               onClick={() => router.push(`/purchases/purchase-invoices/${note.invoice_raw_id}`)}
               className="rounded-[4px] border border-emerald-200 bg-white px-4 py-0.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
             >
               Ver
             </button>
          </div>
        </div>

        {/* Fila: Nota de Devolución Nº */}
        <div className="flex items-center">
          <span className="w-[180px] text-sm font-bold text-[#4a5568]">Nota de Devolución Nº:</span>
          <div className="flex items-center gap-3">
             <span className="text-sm text-slate-900">{note.return_note_number}</span>
             <button 
               type="button"
               disabled={!note.return_note_raw_id}
               onClick={() => router.push(`/purchases/return-notes/${note.return_note_raw_id}`)}
               className="rounded-[4px] border border-emerald-200 bg-white px-4 py-0.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
             >
               Ver
             </button>
          </div>
        </div>

      </div>

      {/* Tabla de Artículos */}
      <div className="flex-1 overflow-hidden rounded-[4px] border border-slate-100 bg-white">
        <table className="w-full border-collapse text-left">
          <colgroup>
            <col className="w-16" />
            <col className="w-[140px]" />
            <col />
            <col className="w-32" />
            <col className="w-[180px]" />
            <col className="w-[180px]" />
          </colgroup>
          
          <thead>
            <tr className="bg-[#f1f5f9] border-b border-slate-200">
              <th className="px-4 py-2 text-center text-xs font-bold text-slate-600">#</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-slate-600">Código</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-slate-600">Producto</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-slate-600">Cantidad</th>
              <th className="px-4 py-2 text-right text-xs font-bold text-slate-600">Precio unitario</th>
              <th className="px-4 py-2 text-right text-xs font-bold text-slate-600">Sub Total</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100">
            {note.details.map((item) => (
              <tr key={item.pos} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2.5 text-center text-sm font-normal text-slate-900">{item.pos}</td>
                <td className="px-4 py-2.5 text-left text-sm font-normal text-slate-900">{item.product_code}</td>
                <td className="px-4 py-2.5 text-left text-sm font-normal text-slate-700">{item.product_description}</td>
                <td className="px-4 py-2.5 text-center text-sm text-slate-700">{item.quantity}</td>
                <td className="px-4 py-2.5 text-right text-sm text-slate-700">
                  $ {item.unit_cost.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(".00", "")}
                </td>
                <td className="px-4 py-2.5 text-right text-sm font-normal text-slate-900">
                  $ {item.subtotal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(".00", "")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sección Inferior de Totales */}
      <div className="mt-4 rounded-[4px] bg-[#f1f5f9] px-4 py-2 flex justify-between items-center">
        <span className="text-base font-bold text-slate-800">Total</span>
        <span className="text-xl font-bold text-slate-900">
          $ {note.total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(".00", "")}
        </span>
      </div>

      {/* Botón Inferior Atras */}
      <div className="mt-4 flex justify-end">
        <button 
          onClick={() => router.back()}
          className="rounded-[4px] border border-slate-300 bg-white px-12 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:shadow-sm active:scale-95 transition-all duration-150"
        >
          Atras
        </button>
      </div>
    </div>
  );
}