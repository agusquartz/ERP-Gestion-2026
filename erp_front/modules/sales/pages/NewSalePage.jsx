
"use client";

import { useState } from "react";

// Hook
import { useSaleForm } from "../hooks/useSaleForm";

// Shared
import { useDisclosure } from "@/shared/hooks/useDisclosure";

// Components
import { SaleHeader } from "../components/newSales/SaleHeader";
import { SaleItemsTable } from "../components/newSales/SaleItemsTable";
import { AddProductPanel } from "../components/newSales/AddProductPanel";
import { SaleSummaryPanel } from "../components/newSales/SaleSummaryPanel";
import { SaleActions } from "../components/newSales/SaleActions";

// Modals
import { ClientSearchModal } from "../modals/ClientSearchModal";
import { ProductSearchModal } from "../modals/ProductSearchModal";
import { ConfirmModal } from "../modals/ConfirmModal";

export default function NewSalePage() {
  const {
    clients,
    selectedClient,
    items,
    subtotal,
    total,
    submitError,
    seller,
    addItem,
    updateItemQty,
    removeItem,
    selectClient,
    addClient,
    validate,
    reset,
  } = useSaleForm();

  const clientModal = useDisclosure();
  const productModal = useDisclosure();
  const confirmModal = useDisclosure();

  const [confirmType, setConfirmType] = useState("factura");
  const [pendingProduct, setPendingProduct] = useState(null);

  const handleSubmit = async (type) => {
    if (!validate()) return;
    setConfirmType(type);
    confirmModal.open();
  };

  const handleConfirmClose = () => {
    confirmModal.close();
    reset();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
      <div className="mb-5">
        <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[42px]">
          Nueva Venta
        </h1>
        <div className="mt-2 h-px w-full bg-foreground/80" />
      </div>

      <SaleHeader
        selectedClient={selectedClient}
        onBuscarCliente={clientModal.open}
        seller={seller}
      />

      {submitError && (
        <div className="mb-4 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <div className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Left column */}
        <div className="flex min-w-0 min-h-0 flex-col gap-4">
          <SaleItemsTable
            items={items}
            onQtyChange={updateItemQty}
            onRemove={removeItem}
          />

          <SaleActions
            onCancel={reset}
            onQuote={() => handleSubmit("presupuesto")}
            onInvoice={() => handleSubmit("factura")}
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <AddProductPanel
            onAdd={addItem}
            onOpenSearch={productModal.open}
            selectedProduct={pendingProduct}
            onClearProduct={() => setPendingProduct(null)}
          />

          <SaleSummaryPanel subtotal={subtotal} total={total} />
        </div>
      </div>

      <ClientSearchModal
        open={clientModal.isOpen}
        onClose={clientModal.close}
        clients={clients}
        onSelect={selectClient}
        onClientCreate={addClient}
      />

      <ProductSearchModal
        open={productModal.isOpen}
        onClose={productModal.close}
        onSelect={(p) => {
          setPendingProduct(p);
          productModal.close();
        }}
      />

      <ConfirmModal
        open={confirmModal.isOpen}
        onClose={handleConfirmClose}
        type={confirmType}
        client={selectedClient}
        subtotal={subtotal}
        total={total}
      />
    </div>
    
  );
}