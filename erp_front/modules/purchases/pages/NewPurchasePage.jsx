
"use client";
import { useState } from "react";
import { usePurchaseForm } from "../hooks/NewPurchase/usePurchaseForm";
import { useDisclosure } from "@/shared/hooks/useDisclosure";


// Components (Asumiendo que creaste versiones para Purchase o reutilizas las de Sales);
import { PurchaseItemsTable } from "../components/NewPurchases/PurchaseItemsTable"; 
import { AddPurchaseProductPanel } from "../components/NewPurchases/AddPurchaseProductPanel.jsx";
import { PurchaseSummaryPanel } from "../components/NewPurchases/PurchaseSummaryPanel";
import { PurchaseInformation } from "../components/NewPurchases/PurchaseInformation";
import { s } from "../styles/NewPurchase/NewPurchasesStyles";
import { PurchaseSearchModal } from "../modals/NewPurchase/PurchaseSearchModal";

export default function NewPurchasePage() {
  const {
    selectedProvider, items, totalItems, totalUnidades, subtotal, iva, total, submitError,
    addItem, updateItemQty, removeItem, selectProvider, reset
  } = usePurchaseForm();


  const productSearchModal = useDisclosure();
  const [pendingProduct, setPendingProduct] = useState(null);

  return (
    <div className={s.container}>
      <div className={s.titleSection}>
        <h1 className={s.pageTitle}>Nuevo Pedido</h1>
      </div>

      <div className={s.contentLayout}>
        {/* COLUMNA IZQUIERDA: Tabla y Botón Guardar */}
        <div className="flex flex-col min-h-0 h-full">
          <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <PurchaseItemsTable 
              items={items} 
              onQtyChange={updateItemQty} 
              onRemove={removeItem}/>
          </div>
          
          {/* Botón Guardar centrado abajo como el Figma */}
          <div className="flex justify-start pt-4 pb-2">
            <button className={s.btnPrimary}>
              Guardar
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: Paneles de control */}
        <div className="flex flex-col gap-4 min-h-0">
          <AddPurchaseProductPanel onOpenSearch={productSearchModal.onOpen} />
          <PurchaseSearchModal 
          open={productSearchModal.isOpen} 
          onClose={productSearchModal.onClose}
          onSelect={(product) => {
            // Adaptamos el objeto si es necesario antes de agregarlo
            addItem({
              ...product,
              cantidad: 1 // Por defecto al seleccionar desde el modal
            });
          }}
        />
          <PurchaseSummaryPanel 
            totalItems={totalItems} 
            totalUnidades={totalUnidades} 
            subtotal={subtotal}/>
          <PurchaseInformation />
        </div>
      </div>
    </div>
  );
}