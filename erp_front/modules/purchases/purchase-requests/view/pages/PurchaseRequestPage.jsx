"use client";

import { useParams, useRouter } from "next/navigation";
import usePurchaseRequests from "../hooks/usePurchaseRequests";

import ItemsTable from "../components/ItemsTable";
import CategoriesTable from "../components/CategoriesTable";
import SuppliersTable from "../components/SuppliersTable";
import SupplierSearchModal from "../modal/SupplierSearchModal";
import SupplierQuotationModal from "../modal/SupplierQuotationModal";

export default function PurchaseRequestPage() {
  const params = useParams();
  const router = useRouter();

  const {
    purchaseRequest,
    orderItems,
    suppliers,
    categories,
    categoryNames,
    categoryIds,
    loading,
    error,

    activeSupplier,
    handleOpenQuotation,
    handleCloseQuotation,
    handleSaveQuotation,
    handlePrint,

    isSupplierSearchOpen,
    handleOpenSupplierSearch,
    handleCloseSupplierSearch,
    searchAvailableSuppliers,
    handleAddSuppliers,

    allGenerated,
    hasPrintableSuppliers,
    handleGenerateOrPrintAll,

    isFinalStatus,
  } = usePurchaseRequests(params.id);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400 text-[14px]">
        Cargando pedido de compra...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-400 text-[14px]">
        {error}
      </div>
    );
  }

  const formattedDate = purchaseRequest?.createdAt
    ? new Date(purchaseRequest.createdAt).toLocaleDateString("es-PY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    /**
     * Root: ocupa exactamente el alto del layout padre (que debe ser h-screen o h-full).
     * overflow-hidden evita cualquier scroll de página.
     * flex-col distribuye: header (shrink-0) → contenido (flex-1 min-h-0) → footer (shrink-0)
     */
    <div className="flex flex-col overflow-hidden bg-surface p-4 md:p-6 rounded-[5px] gap-4" style={{ height: "calc(100vh - 3rem)" }}>

      {/* ── HEADER — altura fija, nunca crece ─────────────────────────────── */}
      <div className="shrink-0">
        <h1 className="text-[26px] font-extrabold leading-none tracking-tight text-foreground">
          Pedido de compra #{purchaseRequest?.id}
        </h1>
        <div className="flex items-center gap-5 mt-2 text-sm text-slate-600">
          <span>
            <span className="font-semibold text-slate-800">Solicitante: </span>
            {purchaseRequest?.requester}
          </span>
          {formattedDate && (
            <span>
              <span className="font-semibold text-slate-800">Creado: </span>
              {formattedDate}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 border-b border-slate-200" />

      {/* ── ITEMS — altura fija proporcional, scroll interno ──────────────── */}
      <section className="shrink-0 flex flex-col" style={{ maxHeight: "30%" }}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Items del pedido
        </p>
        {/* El contenedor de la tabla hace el scroll, no la página */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-[5px] border border-slate-200">
          <ItemsTable items={orderItems} />
        </div>
      </section>

      {/* ── GRID INFERIOR — ocupa todo el espacio restante ────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Categorías */}
        <section className="flex flex-col min-h-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Categorías del pedido
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto rounded-[5px] border border-slate-200">
            <CategoriesTable categories={categories} />
          </div>
        </section>

        {/* Proveedores */}
        <SuppliersTable
          suppliers={suppliers}
          allGenerated={allGenerated}
          hasPrintableSuppliers={hasPrintableSuppliers}
          onOpenQuotation={handleOpenQuotation}
          onGenerateOrPrintAll={handleGenerateOrPrintAll}
          onOpenSupplierSearch={handleOpenSupplierSearch}
        />
      </div>

      {/* ── FOOTER — altura fija, pegado al fondo ─────────────────────────── */}
      <div className="shrink-0 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
        <button
          onClick={() => router.back()}
          className="px-5 py-2 rounded-[5px] border border-border text-secondary text-sm font-medium hover:bg-[#F2F3F7] transition-colors shadow-panel"
        >
          Atrás
        </button>
        <button
          onClick={() =>
            router.push(`/purchases/purchase-requests/${params.id}/analysis`)
          }
          className="px-5 py-2 text-sm font-semibold rounded-[5px] bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          Analizar
        </button>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────── */}
      <SupplierQuotationModal
        supplier={activeSupplier}
        isOpen={!!activeSupplier}
        readonly={isFinalStatus(activeSupplier?.statusId)}
        onClose={handleCloseQuotation}
        onSave={handleSaveQuotation}
        onPrint={handlePrint}
      />

      <SupplierSearchModal
        isOpen={isSupplierSearchOpen}
        categoryNames={categoryNames}
        categoryIds={categoryIds}
        onClose={handleCloseSupplierSearch}
        onSearchSuppliers={searchAvailableSuppliers}
        onConfirm={handleAddSuppliers}
      />
    </div>
  );
}