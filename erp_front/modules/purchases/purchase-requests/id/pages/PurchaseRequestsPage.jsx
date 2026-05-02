/**
 * @file PurchaseRequestsPage.jsx
 * @module modules/purchases/pages
 *
 * @description
 * Main page for viewing a Purchase Order (Pedido de Compra).
 */


/**
 * @file PurchaseOrderPage.jsx
 * @module modules/purchases/pages
 *
 * @description
 * Main page for viewing a Purchase Order (Pedido de Compra).
 *
 * This component is intentionally thin — it only owns layout and wires
 * props/handlers. All state and business logic lives in usePurchaseOrder.
 *
 * Layout notes:
 * - The outer wrapper uses `h-full overflow-hidden` so the page itself
 *   never scrolls; individual table sections handle their own scroll.
 * - A 1px solid border (#e0e3f0) with border-radius 5px wraps the content,
 *   matching the panel style visible in the Figma designs.
 *
 * Component tree:
 *   PurchaseOrderPage
 *   ├── OrderItemsTable      (scrollable body)
 *   ├── CategoriesTable      (scrollable body)
 *   ├── SuppliersTable       (scrollable body, generar/imprimir toggle)
 *   ├── QuotationModal
 *   └── SupplierSearchModal
 *
 * @param {Object}   props
 * @param {string}   props.orderId     - ID of the purchase order to load.
 *                                       In Next.js, pass params.id from the page route.
 * @param {Function} [props.onBack]    - Callback for the "Atras" button.
 * @param {Function} [props.onAnalyze] - Callback for the "Analizar" button.
 *
 * @returns {JSX.Element} The full purchase order page.
 */


"use client";

import { usePurchaseOrder } from "../hooks/purchase-order/usePurchaseOrder";
import OrderItemsTable from "../components/purchase-order/OrderItemsTable";
import CategoriesTable from "../components/purchase-order/CategoriesTable";
import SuppliersTable from "../components/purchase-order/SuppliersTable";
import QuotationModal from "../modal/purchase-order/QuotationModal";
import SupplierSearchModal from "../modal/purchase-order/SupplierSearchModal";
import { btn } from "../styles/purchase-order/purchaseOrderStyles";

export default function PurchaseOrderPage({
  orderId,
  onBack,
  onAnalyze,
}) {
  const {
    // Remote Data
    purchaseOrder,
    orderItems,
    suppliers,
    categories,
    categoryNames,
    loading,
    error,

    // QuotationModal
    activeSupplier,
    handleOpenQuotation,
    handleCloseQuotation,
    handleSaveQuotation,
    handlePrint,

    // SupplierSearchModal
    isSupplierSearchOpen,
    handleOpenSupplierSearch,
    handleCloseSupplierSearch,
    handleAddSuppliers,
    
    // SuppliersTable header button
    allGenerated,
    handleGenerateOrPrintAll,
  } = usePurchaseOrder(orderId);


  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-sm text-muted">Cargando pedido...</p>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }


  // Supplier IDs already on this order — passed to SupplierSearchModal so it
  // can exclude them from the available list.
  const alreadyAddedIds = suppliers.map((s) => s.supplierId);

  return (
    /*
     * Outer panel:
     * - h-full + overflow-hidden keeps the page within its parent height.
     * - The border + border-radius match the panel border visible in the Figma designs.
     *   border-color uses --color-border from globals.css @theme.
     *   border-radius is set inline as 5px to match the exact design spec.
     * - bg-surface gives the white card background.
     * - shadow-panel applies the 2px/2px/5px design shadow.
     */

    <div
      className="h-full overflow-hidden flex flex-col bg-surface p-6 shadow-panel border border-border" 
      style={{ borderRadius: "5px"}}
    >
      
      {/* ── Page header ── */}
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Pedido de compra{" "}
          <span className="text-primary">#{purchaseOrder?.id}</span>
        </h1>
        <p className="text-sm text-muted mt-1">
          <span className="font-semibold text-foreground">Solicitante:</span>{" "}
          {purchaseOrder?.requester}
          <span className="font-semibold text-foreground ml-4">Creado</span>{" "}
          {purchaseOrder?.createdAt}
        </p>
      </div>

      {/*
       * Flexible container — takes all remaining height between header and footer.
       * overflow-hidden prevents any child from leaking outside.
       * Each child manages its own internal scroll.
       */}
      {/* ── Items table (scrollable) ── */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden gap-4">
        <OrderItemsTable items={orderItems} />

        {/* ── Categories + Suppliers (two columns, each scrollable) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
          <CategoriesTable categories={categories} />
          <SuppliersTable
            suppliers={suppliers}
            allGenerated={allGenerated}
            onOpenQuotation={handleOpenQuotation}
            onGenerateOrPrintAll={handleGenerateOrPrintAll}
            onOpenSupplierSearch={handleOpenSupplierSearch}
          />
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="flex justify-end gap-3 mt-4 shrink-0">
        <button
          onClick={onBack}
          className={`${btn.secondary} shadow-panel`}
        >
          Atras
        </button>

        <button
          onClick={onAnalyze}
          className={`${btn.primary} shadow-panel`}
        >
          Analizar
        </button>
      </div>

      {/* ── Quotation modal ── */}
      <QuotationModal
        isOpen={!!activeSupplier}
        supplier={activeSupplier}
        orderItems={orderItems}
        purchaseOrder={purchaseOrder}
        onClose={handleCloseQuotation}
        onSave={handleSaveQuotation}
        onPrint={handlePrint}
      />

      {/* ── Supplier search modal ── */}
      <SupplierSearchModal
        isOpen={isSupplierSearchOpen}
        categoryNames={categoryNames}
        orderId={orderId}
        alreadyAdded={alreadyAddedIds}
        onClose={handleCloseSupplierSearch}
        onConfirm={handleAddSuppliers}
      />
    </div>
  );
}
