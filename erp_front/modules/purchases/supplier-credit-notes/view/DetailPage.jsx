"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupplierCreditNoteById } from "@/lib/http/client/supplier-credit-notes";
import { s } from "../../purchase-requests/new/styles/NewPurchasesStyles"

// Formateador de fechas interno para mantener consistencia con el diseño
function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

// Función encargada de mapear el DTO estricto de Rust (CreditNoteResponse) al Front
function mapBackToFrontCreditNoteDetail(item) {
  return {
    id: item.id,
    note_number: item.note_number || "—",
    created_at: formatDate(item.created_at),
    total: item.total ? parseFloat(item.total) : 0,
    
    // Proveedor mapeado desde SupplierResponse
    supplier_name: item.supplier?.name || "—",
    supplier_stamp: item.supplier?.stamp || "—",
    
    // Formateo estético de IDs numéricos de Rust para simular comprobantes reales en el diseño
    invoice_number: item.invoice_id ? `001-002-${String(item.invoice_id).padStart(7, "0")}` : "—",
    return_note_number: item.return_note_id ? String(item.return_note_id).padStart(4, "0") : "—",
    
    // Fallback estático controlado ya que tu modelo de Rust actual no almacena un campo de motivo
    reason: "La cantidad de ítems facturados exceden la cantidad que figura en la solicitud.",
    
    // Mapeo iterativo de CreditNoteDetailResponse
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
        
        // Petición HTTP real al backend en Rust
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
    <div className="flex h-full flex-col bg-white p-6 md:p-8 font-sans select-none">
      {/* Título Principal de la Nota */}
      <div className="mb-4">
        <h1 className={s.pageTitle}>
          Nota de Crédito #{note.note_number}
        </h1>
      </div>

      {/* Barra de Metadatos superior gris */}
      <div className="mb-6 flex flex-wrap gap-x-12 gap-y-2 rounded-[5px] border border-slate-100 bg-[#f8fafc] px-6 py-4 text-sm shadow-inner">
        <div className="flex gap-2">
          <span className="font-bold text-slate-700">Proveedor:</span>
          <span className="font-normal text-slate-500">{note.supplier_name}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold text-slate-700">Creado:</span>
          <span className="font-normal text-slate-500">{note.created_at}</span>
        </div>
      </div>

      {/* Bloque Informativo de Documentos */}
      <div className="mb-8 rounded-[8px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="w-[140px] text-sm font-bold text-slate-700 pt-0.5">Timbrado:</span>
              <span className="text-sm font-medium text-slate-800 font-mono">{note.supplier_stamp}</span>
            </div>

            <div className="flex items-start">
              <span className="w-[140px] text-sm font-bold text-slate-700 pt-0.5">Motivo:</span>
              <p className="flex-1 text-sm font-normal text-slate-600 leading-relaxed">{note.reason}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <span className="w-[140px] text-sm font-bold text-slate-700">Factura Nº:</span>
              <div className="flex items-center gap-3">
                 <span className="text-sm font-semibold text-slate-900 font-mono">{note.invoice_number}</span>
                 <button className="rounded-[4px] border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all">Ver</button>
              </div>
            </div>

            <div className="flex items-center">
              <span className="w-[140px] text-sm font-bold text-slate-700">Nota de Devolución Nº:</span>
              <div className="flex items-center gap-3">
                 <span className="text-sm font-semibold text-slate-900 font-mono">{note.return_note_number}</span>
                 <button className="rounded-[4px] border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all">Ver</button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tabla de Artículos con Cabecera Gris del Figma original */}
      <div className="flex-1 overflow-hidden rounded-[8px] border border-slate-100 bg-white">
        <table className="w-full border-collapse text-left">
          <colgroup>
            <col className="w-16" />
            <col className="w-[140px]" />
            <col />
            <col className="w-28" />
            <col className="w-[160px]" />
            <col className="w-[160px]" />
          </colgroup>
          
          <thead>
            <tr className="bg-[#f8fafc] border-b border-slate-100">
              <th className="px-5 py-2.5 text-center text-xs font-bold text-slate-500 rounded-tl-[8px]">#</th>
              <th className="px-5 py-2.5 text-left text-xs font-bold text-slate-500">Código</th>
              <th className="px-5 py-2.5 text-left text-xs font-bold text-slate-500">Producto</th>
              <th className="px-5 py-2.5 text-center text-xs font-bold text-slate-500">Cantidad</th>
              <th className="px-5 py-2.5 text-right text-xs font-bold text-slate-500">Precio unitario</th>
              <th className="px-5 py-2.5 text-right text-xs font-bold text-slate-500 rounded-tr-[8px]">Sub Total</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-50">
            {note.details.map((item) => (
              <tr key={item.pos} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3 text-center text-sm font-bold text-slate-900">{item.pos}</td>
                <td className="px-5 py-3 text-left text-sm font-bold text-slate-900 font-mono">{item.product_code}</td>
                <td className="px-5 py-3 text-left text-sm font-medium text-slate-800">{item.product_description}</td>
                <td className="px-5 py-3 text-center text-sm text-slate-700 font-medium">{item.quantity}</td>
                <td className="px-5 py-3 text-right text-sm text-slate-700 font-mono">
                  $ {item.unit_cost.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3 text-right text-sm font-bold text-slate-900 font-mono">
                  $ {item.subtotal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sección Inferior de Totales */}
      <div className="mt-6 rounded-[8px] border border-slate-100 bg-[#f8fafc] px-6 py-4">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-slate-800">Total</span>
          <span className="text-[32px] font-extrabold text-slate-950 tracking-tight font-mono">
            $ {note.total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Botón Inferior Atras */}
      <div className="mt-6 flex justify-end">
        <button 
          onClick={() => router.back()}
          className="rounded-[5px] border border-slate-300 bg-white px-10 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150"
        >
          Atras
        </button>
      </div>
    </div>
  );
}