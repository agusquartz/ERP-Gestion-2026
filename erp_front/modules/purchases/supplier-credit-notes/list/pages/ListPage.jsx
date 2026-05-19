"use client";

import { useEffect, useState } from "react";
import { CreditNoteSearch } from "../components/CreditNoteSearch";
import { CreditNoteTable } from "../components/CreditNoteTable";
import { s } from "../../../purchase-requests/new/styles/NewPurchasesStyles"
import { useRouter } from "next/navigation";

// 1. IMPORTAS LA FUNCIÓN DESDE TU CAPA DE SERVICIOS
import { listSupplierCreditNotes, getSupplierCreditNoteById } from "@/lib/http/client/supplier-credit-notes";


function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// Mapea el DTO de Rust (CreditNoteResponse) al formato que espera la tabla
function mapBackToFrontCreditNote(item) {
  return {
    id: item.id,
    credit_note_number: item.note_number || "—",
    return_note_number: item.return_note_id ? String(item.return_note_id) : "—",
    invoice_number: item.invoice_id ? `001-002-${String(item.invoice_id).padStart(7, "0")}` : "—",
    date: formatDate(item.created_at),
    amount: item.total ? parseFloat(item.total).toLocaleString('en-US', { minimumFractionDigits: 0 }) : "0",
  };
}

export default function ListPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentFilters, setCurrentFilters] = useState({}); // Guardamos los filtros activos
  const [selectedCreditNoteDetail, setSelectedCreditNoteDetail] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const router = useRouter();

  // 2. FUNCIÓN QUE HACE LA PETICIÓN AL BACKEND
  async function loadCreditNotes(filters = {}) {
    try {
      setLoading(true);
      setError("");

      // Llamada real a la API de Rust pasando los filtros del Figma
      const data = await listSupplierCreditNotes(filters);
      
      // Mapeamos el array de respuestas de Rust
      const mappedData = data.map(mapBackToFrontCreditNote);
      setCreditNotes(mappedData);

    } catch (error) {
      console.error("Error cargando notas de crédito:", error);
      setError(error.message || "No se pudieron cargar las notas de crédito de proveedores");
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial al montar la página
  useEffect(() => {
    loadCreditNotes();
  }, []);

  // 3. EJECUTA LA BÚSQUEDA CUANDO EL USUARIO ESCRIBE O CAMBIA LAS FECHAS
  const handleSearch = (filters) => {
    setCurrentFilters(filters);
    loadCreditNotes(filters); // Reelanza la petición con los Query Params estructurados
  };

const handleView = async (id) => {
  const note = creditNotes.find((n) => n.id === id);
  if (!note) return;

  console.log("Iniciando consulta para nota de crédito:", note.credit_note_number);

  try {
    setViewLoading(true);
    
    // 2. Llamamos a tu endpoint pasándole el ID
    const detailedData = await getSupplierCreditNoteById(id);
    
    // Aquí ya tienes el objeto exacto de Rust 'CreditNoteResponse'
    // Con: detailedData.supplier, detailedData.details (productos, subtotales, etc.)
    console.log("Datos completos del backend:", detailedData);

    // 3. Guardamos el detalle en el estado (útil para pasárselo a un Modal)
    setSelectedCreditNoteDetail(detailedData);
    
    // EJEMPLO: Si usaras enrutamiento para ir a otra página, harías:
    router.push(`/purchases/supplier-credit-notes/${id}`);

  } catch (err) {
    console.error("Error al obtener el detalle de la nota de crédito:", err);
    alert("No se pudo cargar el detalle de la nota de crédito: " + err.message);
  } finally {
    setViewLoading(false);
  }
};
  return (
    <div className="flex h-full min-h-0 flex-col bg-white p-4 md:p-6 rounded-[5px]">
      <div className="mb-2">
        <h1 className={s.pageTitle}>
          Notas de Crédito de proveedores
        </h1>
        <div className="mt-4 h-[1px] w-full bg-slate-200" />
      </div>

      <CreditNoteSearch onSearch={handleSearch} />

      {loading && (
        <div className="py-6 text-sm text-slate-400">
          Cargando notas de crédito de proveedores...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <CreditNoteTable
          creditNotes={creditNotes}
          onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
          onView={handleView}
        />
      )}
    </div>
  );
}