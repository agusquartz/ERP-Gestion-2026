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
    <div className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-24px)] md:h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
          Notas de Crédito
        </h1>
         <p className="mt-1 text-sm text-muted-foreground">
           Consultá y gestioná notas de crédito de proveedores.
       </p>
       <div className="mt-2 h-px w-full bg-border" />
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
        <div className="py-4 border-t border-border bg-surface">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            hasMore={hasMore}
            goToPage={goToPage}
          />
        </div>
      )}
    </div>
  );
}