"use client";

import { useParams, useRouter } from "next/navigation";
import usePurchaseRequests from "../hooks/usePurchaseRequests";

import ItemsTable from "../components/ItemsTable";
import CategoriesTable from "../components/CategoriesTable";
import SuppliersTable from "../components/SuppliersTable";
import SupplierSearchModal from "../modal/SupplierSearchModal";
import SupplierQuotationModal from "../modal/SupplierQuotationModal";

/**
 * -----------------------------------------------------------------------------
 * PurchaseRequestPage
 * -----------------------------------------------------------------------------
 *
 * Main page component for the Purchase Request detail view.
 *
 * This component acts as the presentation layer for the entire purchase request
 * workflow. It does not contain the business logic directly; instead, it relies
 * on the `usePurchaseRequests` hook to provide:
 * - loaded request data
 * - derived summary data
 * - quotation handlers
 * - supplier search handlers
 * - modal state
 * - bulk actions
 *
 * Main responsibilities:
 * -----------------------------------------------------------------------------
 * - Read the purchase request ID from the route.
 * - Load request data through the custom hook.
 * - Render the header with request metadata.
 * - Render items, categories, and supplier tables.
 * - Open and close quotation/search modals.
 * - Handle navigation actions.
 * - Delegate save/print/generate logic to the hook.
 *
 * Return:
 * -----------------------------------------------------------------------------
 * - A full page layout composed of:
 *   - header
 *   - items table
 *   - categories table
 *   - suppliers table
 *   - footer actions
 *   - quotation modal
 *   - supplier search modal
 * -----------------------------------------------------------------------------
 */
export default function PurchaseRequestPage() {
  /**
   * Route params.
   *
   * Expected route structure:
   * /purchases/purchase-requests/[id]
   */
  const params = useParams();

  /**
   * Next.js router instance.
   * Used for navigation actions such as:
   * - going back
   * - moving to the analysis page
   */
  const router = useRouter();

  /**
   * Custom hook that provides all purchase request state and actions.
   *
   * The hook returns:
   * - loaded data: purchaseRequest, orderItems, suppliers, categories, etc.
   * - modal state: activeSupplier, isSupplierSearchOpen
   * - handlers: open/close/save/print/generate/search/add
   * - derived flags: allGenerated, hasPrintableSuppliers
   * - helper methods: isFinalStatus
   */
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

  // ── Loading / error states ────────────────────────────────────────────────

  /**
   * While the request is still loading, render a simple loading state.
   */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400 text-[14px]">
        Cargando pedido de compra...
      </div>
    );
  }

  /**
   * If the hook returns an error, render it instead of the page layout.
   */
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-400 text-[14px]">
        {error}
      </div>
    );
  }

  /**
   * Formats the creation date of the purchase request for display.
   *
   * If no date exists, the value remains null.
   */
  const formattedDate = purchaseRequest?.createdAt
    ? new Date(purchaseRequest.createdAt).toLocaleDateString("es-PY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    /**
     * Main page container.
     *
     * Design goals:
     * - fill the visible screen area
     * - prevent outer page scrolling
     * - keep header/footer fixed in place
     * - allow inner sections to scroll independently
     */
    <div
      className="flex flex-col overflow-hidden bg-surface p-4 md:p-6 rounded-[5px] gap-4"
      style={{ height: "calc(100vh - 3rem)" }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      {/* Shows the purchase request identifier and basic metadata. */}
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

      {/* Simple divider between header and body sections. */}
      <div className="shrink-0 border-b border-slate-200" />

      {/* ── ITEMS SECTION ───────────────────────────────────────────────────── */}
      {/* Displays the order items belonging to the purchase request. */}
      <section className="shrink-0 flex flex-col" style={{ maxHeight: "30%" }}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Items del pedido
        </p>

        {/* The table itself is wrapped in a scroll container so the page does not scroll. */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-[5px] border border-slate-200">
          <ItemsTable items={orderItems} />
        </div>
      </section>

      {/* ── LOWER GRID ─────────────────────────────────────────────────────── */}
      {/* Two-column layout:
          - left: categories summary
          - right: suppliers and quotation workflow
      */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categories summary */}
        <section className="flex flex-col min-h-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Categorías del pedido
          </p>

          <div className="flex-1 min-h-0 overflow-y-auto rounded-[5px] border border-slate-200">
            <CategoriesTable categories={categories} />
          </div>
        </section>

        {/* Suppliers section */}
        <SuppliersTable
          suppliers={suppliers}
          allGenerated={allGenerated}
          hasPrintableSuppliers={hasPrintableSuppliers}
          onOpenQuotation={handleOpenQuotation}
          onGenerateOrPrintAll={handleGenerateOrPrintAll}
          onOpenSupplierSearch={handleOpenSupplierSearch}
        />
      </div>

      {/* ── FOOTER ACTIONS ─────────────────────────────────────────────────── */}
      {/* Navigation buttons for leaving the page or moving to the analysis view. */}
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

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {/* Quotation modal:
          - opens when a supplier is selected
          - supports read-only mode for final statuses
      */}
      <SupplierQuotationModal
        supplier={activeSupplier}
        isOpen={!!activeSupplier}
        readonly={isFinalStatus(activeSupplier?.statusId)}
        onClose={handleCloseQuotation}
        onSave={handleSaveQuotation}
        onPrint={handlePrint}
      />

      {/* Supplier search modal:
          - used to add new suppliers to the request
      */}
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