"use client";

import { useState } from "react";

// Hook
import { useSaleForm } from "../hooks/useSaleForm";

// Shared
import { useDisclosure } from "@/shared/hooks/useDisclosure";

// Components
import { SaleHeader }      from "../components/SaleHeader";
import { SaleItemsTable }  from "../components/SaleItemsTable";
import { AddProductPanel } from "../components/AddProductPanel";
import { SaleSummaryPanel } from "../components/SaleSummaryPanel";
import { SaleActions }     from "../components/SaleActions";

// Modals
import { ClientSearchModal }  from "../features/modals/ClientSearchModal";
import { ProductSearchModal } from "../features/modals/ProductSearchModal";
import { ConfirmModal }       from "../features/modals/ConfirmModal";

// Styles
import { s } from "../styles/salesStyles";

// Services — descomentar cuando tengas la API lista
// import { createSale, createQuote } from "../services/salesService";

export default function NewSalePage() {
  const {
    clients,
    selectedClient,
    items,
    subtotal, iva, total,
    submitError,
    addItem,
    updateItemQty,
    removeItem,
    selectClient,
    addClient,
    validate,
    reset,
    buildPayload,
  } = useSaleForm();

  // Modales
  const clientModal  = useDisclosure();
  const productModal = useDisclosure();
  const confirmModal = useDisclosure();
  const [confirmType, setConfirmType] = useState("factura");

  // Producto pendiente seleccionado desde el modal
  const [pendingProduct, setPendingProduct] = useState(null);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (type) => {
    if (!validate()) return;
    setConfirmType(type);

    // Con API real:
    // try {
    //   const payload = buildPayload();
    //   type === "factura" ? await createSale(payload) : await createQuote(payload);
    // } catch (err) {
    //   console.error(err);
    //   return;
    // }

    confirmModal.open();
  };

  const handleConfirmClose = () => {
    confirmModal.close();
    reset();
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={s.pageTitle}>Nueva Venta</h1>

      <SaleHeader
        selectedClient={selectedClient}
        onBuscarCliente={clientModal.open}
      />

      {submitError && <div style={s.errorBanner}>{submitError}</div>}

      <div style={s.contentLayout}>
        {/* Izquierda: tabla + acciones */}
        <div styles={{ display: "flex", flexDirection: "column", gap: 12}}>
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

        {/* Derecha: agregar producto + resumen */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AddProductPanel
            onAdd={addItem}
            onOpenSearch={productModal.open}
            selectedProduct={pendingProduct}
            onClearProduct={() => setPendingProduct(null)}
          />
          <SaleSummaryPanel subtotal={subtotal} iva={iva} total={total} />
        </div>
      </div>

      {/* Modales */}
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
        onSelect={(p) => setPendingProduct(p)}
      />

      <ConfirmModal
        open={confirmModal.isOpen}
        onClose={handleConfirmClose}
        type={confirmType}
        client={selectedClient}
        subtotal={subtotal}
        iva={iva}
        total={total}
      />
    </div>
  );
}
