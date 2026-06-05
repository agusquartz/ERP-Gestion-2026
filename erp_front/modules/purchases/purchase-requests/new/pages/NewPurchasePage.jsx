
"use client";

import { useState } from "react";
import { usePurchaseForm } from "../hooks/usePurchaseForm";
import { useDisclosure } from "@/shared/hooks/useDisclosure";
import { Toaster, toast } from 'sonner';
import { createPurchaseRequest } from "@/lib/http/client/purchase-request";

import { PurchaseItemsTable } from "../components/PurchaseItemsTable"; 
import { AddPurchaseProductPanel } from "../components/AddPurchaseProductPanel.jsx";
import { PurchaseSummaryPanel } from "../components/PurchaseSummaryPanel";
import { PurchaseInformation } from "../components/PurchaseInformation";
import { s } from "../styles/NewPurchasesStyles";
import { PurchaseSearchModal } from "../modals/PurchaseSearchModal";
import { PurchaseActions } from "../components/PurchaseActions";

/**
 * Main Page Component for Creating New Purchase Requests.
 * Orchestrates the integration between the purchase hook, product search, and API submission.
 */
export default function NewPurchasePage() {
  // Destructuring state and methods from the custom purchase logic hook
  const {
    items, totalItems, totalUnidades, subtotal,
    addItem, updateItemQty, removeItem, reset, buildPayload // Ensure buildPayload is exposed here
  } = usePurchaseForm();

  // Control state for the advanced search modal visibility
  const productSearchModal = useDisclosure();

  // Temporary state for products selected but not yet confirmed (if needed)
  const [pendingProduct] = useState("");

  /**
   * Handles the final submission of the purchase request.
   * Validates the form and triggers a toast notification with promise tracking.
   */
  const handleSave = async () => {
    // Validation: Prevent submission if the items list is empty
    if (items.length === 0) {
      return toast.warning("Solicitud incompleta", {
        description: "Debes agregar al menos un producto antes de guardar."
      });
    }

    /**
     * Internal async function to wrap the API call and payload construction.
     */
    const savePromise = async () => {
      // Structure data following the backend DTO standard (CamelCase)
      const requestData = buildPayload(); 

      return await createPurchaseRequest(requestData);
    };

    // Trigger Sonner toast with loading, success, and error states
    toast.promise(savePromise(), {
      loading: 'Registrando pedido de productos...',
      success: () => {
        // Clear the table state only upon successful persistence
        reset(); 
        return 'Pedido registrado. Listo para cotizar.';
      },
      error: 'Error: No se pudo registrar el pedido.',
    });
  };

  return (
    <div className={s.container}>
      <Toaster position="top-right" richColors />
      
      {/* HEADER SECTION */}
      <div className={s.titleSection}>
        <h1 className={s.pageTitle}>Nuevo Pedido</h1>
         <p className="mt-1 text-sm text-muted-foreground">
          Registrá un nuevo pedido de compra.
        </p>
         <div className="mt-2 h-px w-full bg-border" />

       

      </div>
      

      <div className={s.contentLayout}>
        {/* LEFT COLUMN: Main items table and action triggers */}
        <div className="flex flex-col min-h-0 h-full">
          <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <PurchaseItemsTable 
              items={items} 
              onQtyChange={updateItemQty} 
              onRemove={removeItem}/>
          </div>
          
          {/* Action Footer: Primary save button */}
          <PurchaseActions onRegister={handleSave}/>
        </div>

        {/* RIGHT COLUMN: Control panels for product entry and summaries */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Quick-add panel via code scan */}
          <AddPurchaseProductPanel 
            onOpenSearch={productSearchModal.open} 
            onAdd={addItem}
            selectedProduct={pendingProduct} 
            onClearProduct={() => ("")}/>
          
          {/* Advanced product search modal */}
          <PurchaseSearchModal 
            open={productSearchModal.isOpen} 
            onClose={productSearchModal.close}
            onSelect={(product) => { 
              addItem({
                ...product,
                cantidad: 1
              });
            }}
          />

          {/* Dynamic numeric summary of the current request */}
          <PurchaseSummaryPanel 
            totalItems={totalItems} 
            totalUnidades={totalUnidades} 
            subtotal={subtotal}/>
            
          {/* Static contextual information or help panel */}
          <PurchaseInformation />
        </div>
      </div>
    </div>
  );
}