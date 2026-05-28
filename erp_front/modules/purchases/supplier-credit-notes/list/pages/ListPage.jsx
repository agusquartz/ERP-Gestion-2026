"use client";

import { useState } from "react";
import { useSupplierCreditNotes } from "../hooks/useSupplierCreditNotes"; // Ajusta el path
import { CreditNoteSearch } from "../components/CreditNoteSearch"; // Reutilizamos el filtro estético
import { Pagination } from "../../../purchase-invoices/list/components/Pagination"; // El componente de paginación de tu compañero
import { useRouter } from "next/navigation";
import { CreditNoteTable } from "../components/CreditNoteTable";

export default function CreditNotesListPage() {
  const router = useRouter();
  
  // Estado local para agrupar los filtros activos
  const [filters, setFilters] = useState({
    search: "",
    filter: "",
    since: "",
    to: "",
  });


  // Consumimos el nuevo hook de paginación por cursores
  const {
    creditNotes,
    loading,
    error,
    currentPage,
    hasMore,
    totalPages,
    goToPage
  } = useSupplierCreditNotes(filters);

  return (
    <div className="p-6 bg-white space-y-4 max-w-[1400px] mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notas de Crédito de proveedores</h1>
      </div>

      {/* Barra de Filtros interactiva */}
      <CreditNoteSearch 
        onSearch={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
      />

      <CreditNoteTable 
        creditNotes={creditNotes} 
        onView={(id) => router.push(`/purchases/supplier-credit-notes/${id}`)}
        onSelect={(id) => console.log("Fila seleccionada:", id)}
      />

      {/* Estado: Éxito */}
      {!loading && !error && (
        <>
          {/* Componente de Paginación que usamos de purchase-invoices/list */}
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            hasMore={hasMore}
            goToPage={goToPage}
          />
        </>
      )}
    </div>
  );
}