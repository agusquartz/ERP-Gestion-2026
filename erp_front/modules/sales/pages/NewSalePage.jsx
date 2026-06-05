
"use client";

import { useEffect, useState } from "react";

// API
import { createQuote, getQuoteById } from "@/lib/http/client/quotes";
import { getClientById } from "@/lib/http/client/clients";
import { getProductById } from "@/lib/http/client/sales";
import { createInvoice } from "@/lib/http/client/invoices";

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

function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function generateTemporaryInvoiceNumber() {
  const sequence = String(Date.now()).slice(-7).padStart(7, "0");

  return `001-001-${sequence}`;
}


export default function NewSalePage({ quoteId }) {
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
    loadQuoteIntoForm,
  } = useSaleForm();

  const clientModal = useDisclosure();
  const productModal = useDisclosure();
  const confirmModal = useDisclosure();

  const [confirmType, setConfirmType] = useState("factura");
  const [pendingProduct, setPendingProduct] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  useEffect(() => {
    if (!quoteId) return;

    let cancelled = false;

    async function loadQuote() {
      try {
        setIsLoadingQuote(true);
        setApiError(null);

        const quote = await getQuoteById(quoteId);
        console.log("QUOTE RESPONSE:", quote);

        const clientId = quote.clientId ?? quote.client?.id;

        if (!clientId) {
          throw new Error("El presupuesto no tiene cliente asociado");
        }

        const quoteDetails = quote.details ?? [];

        const [client, products] = await Promise.all([
          getClientById(clientId),

          Promise.all(
            quoteDetails.map(async (detail) => {
              const productId = detail.productId ?? detail.product?.id;

              if (!productId) {
                throw new Error("Un detalle del presupuesto no tiene producto asociado");
              }

              const product = await getProductById(productId);

              return {
                detail,
                product,
              };
            })
          ),
        ]);
        console.log("CLIENT:", client);
        console.log("PRODUCTS:", products);

        if (cancelled) return;

        loadQuoteIntoForm({
          client,
          products,
        });
      } catch (error) {
        if (!cancelled) {
          setApiError(error.message || "Error al cargar el presupuesto");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingQuote(false);
        }
      }
    }

    loadQuote();

    return () => {
      cancelled = true;
    };
  }, [quoteId, loadQuoteIntoForm]);

  const buildInvoicePayload = () => {
    const date = getTodayLocalDate();

    return {
      clientId: Number(selectedClient.id),

      // Temporal. Idealmente esto debería generarlo el backend.
      invoiceNumber: generateTemporaryInvoiceNumber(),

      date,
      expirationDate: date,

      // 1 podría representar contado, depende de tu tabla sale_conditions
      saleConditionId: 1,

      // Si venís desde un presupuesto, se asocia.
      quoteId: quoteId ? Number(quoteId) : null,

      details: items.map((item) => ({
        productId: Number(item.productoId),
        quantity: Number(item.cantidad),

        // Decimal en Rust suele recibir bien string.
        unitCost: item.price.toString(),
      })),
    };
  };

  const handleSubmit = async (type) => {
    if (!validate()) return;
    if (isSubmitting) return;

    setApiError(null);
    setIsSubmitting(true);

    try {
      if (type === "presupuesto") {
        const createdAt = getTodayLocalDate();

        const payload = {
          clientId: Number(selectedClient.id),
          statusId: 1,
          createdAt,
          details: items.map((item) => ({
            productId: Number(item.productoId),
            unitCost: item.price.toString(),
            tax: "10",
            quantity: Number(item.cantidad),
          })),
        };

        await createQuote(payload);
      }

      if (type === "factura") {
        const payload = buildInvoicePayload();

        console.log("INVOICE PAYLOAD:", payload);

        await createInvoice(payload);
      }

      setConfirmType(type);
      confirmModal.open();
    } catch (error) {
      setApiError(error.message || "Error al procesar la operación");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {console.log(quoteId)});

  const handleConfirmClose = () => {
    confirmModal.close();
    reset();
  };

  const displayError = apiError || submitError;

  return (
    
    <div className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-24px)] md:h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[33px]">
          Nueva Venta
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
            Agregá productos, verificá el total y finalizá la venta.
        </p>
        <div className="mt-2 h-px w-full bg-border" />
      </div>

      <SaleHeader
        selectedClient={selectedClient}
        onBuscarCliente={clientModal.open}
        seller={seller}
      />

      {displayError && (
        <div className="mb-4 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {displayError}
        </div>
      )}

      {isLoadingQuote && (
        <div className="mb-4 rounded-[5px] border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Cargando presupuesto...
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
            disabled={isSubmitting || isLoadingQuote}
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <AddProductPanel
            onAdd={addItem}
            onOpenSearch={productModal.open}
            selectedProduct={pendingProduct}
            onClearProduct={() => setPendingProduct(null)}
            onProductFound={setPendingProduct}
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