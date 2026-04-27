
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
import { PurchaseActions } from "../components/NewPurchases/PurchaseActions";

export default function NewPurchasePage() {
  const {
    items, totalItems, totalUnidades, subtotal, submitError,
    addItem, updateItemQty, removeItem, reset
  } = usePurchaseForm();


  const productSearchModal = useDisclosure();
  console.log("Estado del modal:", productSearchModal.isOpen);
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
          
          {/* Botón Guardar */}
          <PurchaseActions/>
      </div>

        {/* COLUMNA DERECHA: Paneles de control */}
        <div className="flex flex-col gap-4 min-h-0">
          <AddPurchaseProductPanel 
            onOpenSearch={productSearchModal.open} 
            onAdd={addItem}
            selectedProduct={null} 
            onClearProduct={() => {}}/>
          <PurchaseSearchModal 
            open={productSearchModal.isOpen} 
            onClose={productSearchModal.close}
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