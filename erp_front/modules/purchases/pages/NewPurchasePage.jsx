
"use client";
import { useState } from "react";
import { usePurchaseForm } from "../hooks/usePurchaseForm";
import { useDisclosure } from "@/shared/hooks/useDisclosure";


// Components (Asumiendo que creaste versiones para Purchase o reutilizas las de Sales)
import { PurchaseHeader } from "../components/newPurchases/PurchaseHeader";
import { PurchaseItemsTable } from "../components/NewPurchases/PurchaseItemsTable"; 
import { AddPurchaseProductPanel } from "../components/NewPurchases/AddPurchaseProductPanel.jsx";
import { PurchaseSummaryPanel } from "../components/NewPurchases/PurchaseSummaryPanel";
import { PurchaseActions } from "../components/NewPurchases/PurchaseActions";
import { s } from "../styles/NewPurchase/NewPurchasesStyles";

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
    <div style={{ ...s.container, display: 'flex', flexDirection: 'column', height: '100%', gap: '8px'}}>
      <div style={{...s.headerSection}}>
        <h1 style={s.pageTitle}>Nuevo Pedido de Compra</h1>
        <div style={s.divider} />
      </div>

      <PurchaseHeader />

      <div style={s.contentLayout}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{...s.tableSection, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column'}}>
            <PurchaseItemsTable items={items} />
          </div>
          <PurchaseActions />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AddPurchaseProductPanel />
          <PurchaseSummaryPanel />
        </div>
      </div>
    </div>
    </div>
  );
}