"use client";
import { useState } from "react";
import { usePurchaseForm } from "../hooks/usePurchaseForm";
import { useDisclosure } from "@/shared/hooks/useDisclosure";

// Components (Asumiendo que creaste versiones para Purchase o reutilizas las de Sales)
import { PurchaseHeader } from "../components/newPurchases/PurchaseHeader";
import { SaleItemsTable } from "../../sales/components/SaleItemsTable"; 
import { AddProductPanel } from "../../sales/components/AddProductPanel.jsx";
import { SaleSummaryPanel } from "../../sales/components/SaleSummaryPanel";

export default function NewPurchasePage() {
  const {
    selectedProvider, items, subtotal, iva, total, submitError,
    addItem, updateItemQty, removeItem, selectProvider, reset
  } = usePurchaseForm();

  const providerModal = useDisclosure();
  const productModal = useDisclosure();
  const [pendingProduct, setPendingProduct] = useState(null);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
      <div className="mb-5">
        <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[42px]">
          Nuevo Pedido de Compra
        </h1>
        <div className="mt-2 h-px w-full bg-foreground/80" />
      </div>

      <PurchaseHeader 
        selectedProvider={selectedProvider} 
        onBuscarProveedor={providerModal.open} 
      />

      <div className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 min-h-0 flex-col gap-4">
          <SaleItemsTable items={items} onQtyChange={updateItemQty} onRemove={removeItem} />
          <button className="w-full bg-primary text-white py-3 rounded-[5px] font-bold uppercase tracking-wider hover:bg-primary-hover transition-colors">
            Guardar Pedido
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <AddProductPanel 
            onAdd={addItem} 
            onOpenSearch={productModal.open}
            selectedProduct={pendingProduct}
            onClearProduct={() => setPendingProduct(null)}
          />
          <SaleSummaryPanel subtotal={subtotal} iva={iva} total={total} />
        </div>
      </div>
      {/* Aquí irían los modales similares a los de NewSalePage */}
    </div>
  );
}