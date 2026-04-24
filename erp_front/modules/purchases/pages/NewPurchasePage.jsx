
"use client";
import { useState } from "react";
import { usePurchaseForm } from "../hooks/usePurchaseForm";
import { useDisclosure } from "@/shared/hooks/useDisclosure";


// Components (Asumiendo que creaste versiones para Purchase o reutilizas las de Sales);
import { PurchaseItemsTable } from "../components/NewPurchases/PurchaseItemsTable"; 
import { AddPurchaseProductPanel } from "../components/NewPurchases/AddPurchaseProductPanel.jsx";
import { PurchaseSummaryPanel } from "../components/NewPurchases/PurchaseSummaryPanel";
import { PurchaseActions } from "../components/NewPurchases/PurchaseActions";
import { PurchaseInformation } from "../components/NewPurchases/PurchaseInformation";
import { s } from "../styles/NewPurchase/NewPurchasesStyles";
import { mock_items } from "../services/mock";

export default function NewPurchasePage() {
  const {
    selectedProvider, items, subtotal, iva, total, submitError,
    addItem, updateItemQty, removeItem, selectProvider, reset
  } = usePurchaseForm();

  const providerModal = useDisclosure();
  const productModal = useDisclosure();
  const [pendingProduct, setPendingProduct] = useState(null);

  return (
    <div className={s.container}>
      <div className={s.titleSection}>
        <h1 className={s.pageTitle}>Nuevo Pedido</h1>
      </div>

      <div className={s.contentLayout}>
        {/* COLUMNA IZQUIERDA: Tabla y Botón Guardar */}
        <div className="flex flex-col min-h-0">
          <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <PurchaseItemsTable 
              items={mock_items} 
              onQtyChange={updateItemQty} 
              onRemove={removeItem}/>
          </div>
          
          {/* Botón Guardar centrado abajo como el Figma */}
          <div className="flex justify-center py-6">
            <button className="bg-[#2563eb] text-white px-12 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-md">
              GUARDAR
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: Paneles de control */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <AddPurchaseProductPanel />
          <PurchaseSummaryPanel />
          <PurchaseInformation />
        </div>
      </div>
    </div>
  );
}