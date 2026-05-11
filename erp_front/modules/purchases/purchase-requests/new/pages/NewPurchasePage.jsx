
"use client";
import { useState } from "react";
import { usePurchaseForm } from "../hooks/usePurchaseForm";
import { useDisclosure } from "@/shared/hooks/useDisclosure";
import { Toaster, toast } from 'sonner'; // Importamos Sonner
import { createPurchaseRequest } from "@/lib/http/client/purchase-request";


// Components (Asumiendo que creaste versiones para Purchase o reutilizas las de Sales);
import { PurchaseItemsTable } from "../components/PurchaseItemsTable"; 
import { AddPurchaseProductPanel } from "../components/AddPurchaseProductPanel.jsx";
import { PurchaseSummaryPanel } from "../components/PurchaseSummaryPanel";
import { PurchaseInformation } from "../components/PurchaseInformation";
import { s } from "../styles/NewPurchasesStyles";
import { PurchaseSearchModal } from "../modals/PurchaseSearchModal";
import { PurchaseActions } from "../components/PurchaseActions";

export default function NewPurchasePage() {
  const {
    items, totalItems, totalUnidades, subtotal,
    addItem, updateItemQty, removeItem, reset
  } = usePurchaseForm();


  const productSearchModal = useDisclosure();

  const [pendingProduct, setPendingProduct] = useState(null);

const handleSave = async () => {
    // 1. Validación: No guardar si está vacío
  if (items.length === 0) {
    return toast.warning("Solicitud incompleta", {
      description: "Debes agregar al menos un producto antes de guardar."
    });
  }

    // 2. Creamos la promesa para el guardado
    const savePromise = async () => {
      // Estructuramos los datos según el estándar del backend (CamelCase)
      const requestData = buildPayLoad();

      return await createPurchaseRequest(requestData);
    };

    // 3. Disparamos el Toast con estado de carga, éxito y error
    toast.promise(savePromise(), {
      loading: 'Registrando pedido de productos...',
      success: () => {
        reset(); // Limpiamos la tabla solo si se guardó bien
        return 'Pedido registrado. Listo para cotizar.';
      },
      error: 'Error: No se pudo registrar el pedido.',
    });
  };

  return (
    <div className={s.container}>
      <Toaster position="top-right" richColors />
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
          <PurchaseActions onSave={handleSave}/>
      </div>

        {/* COLUMNA DERECHA: Paneles de control */}
        <div className="flex flex-col gap-4 min-h-0">
          <AddPurchaseProductPanel 
            onOpenSearch={productSearchModal.open} 
            onAdd={addItem}
            selectedProduct={pendingProduct} 
            onClearProduct={() => setPendingProduct(null)}/>
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