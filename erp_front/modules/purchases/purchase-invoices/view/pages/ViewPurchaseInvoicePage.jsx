"use client";
 
import { useState } from "react";
import { InvoiceDetailHeader }  from "../components/InvoiceDetailHeader.jsx";
import { InvoiceDetailTabs }    from "../components/InvoiceDetailTabs.jsx";
import { ProductsTab }          from "../components/ProductsTab.jsx";
import { PaymentsTab }          from "../components/PaymentsTab.jsx";
import { ReturnNotesTab }       from "../components/ReturnNotesTab.jsx";
import { usePurchaseInvoiceDetail }      from "../hooks/usePurchaseInvoiceDetail.js";
import { usePurchaseInvoicePayments }    from "../hooks/usePurchaseInvoicePayments.js";
import { usePurchaseInvoiceReturnNotes } from "../hooks/usePurchaseInvoiceReturnNotes.js";


// Main detail page for a purchase invoice.
// Route: /purchases/purchase-invoices/{id}
//
// Structure:
// - InvoiceDetailHeader: invoice number + supplier (always visible)
// - InvoiceDetailTabs: tab switcher
// - Tab content: Productos | Pagos de la Factura | Notas de Devolución
//
// Data is fetched per-tab on mount — payments and return notes are loaded
// lazily only when the user first visits those tabs.
export default function ViewPurchaseInvoicePage({ id }) {
  // State to track which tab is currently active ("products", "payments", or "returnNotes")
  const [activeTab, setActiveTab] = useState("products");

  // --- Hook for invoice detail (always loaded) ---
  const {
    invoice,
    loading: loadingInvoice,
    error:   errorInvoice,
  } = usePurchaseInvoiceDetail(id);

  // --- Hook for payment orders — depends on invoice object.
  //     When invoice becomes available, this hook fetches payments lazily.
  const {
      payments,
      loading: loadingPayments,
      error:   errorPayments,
  } = usePurchaseInvoicePayments(invoice);

  // --- Hook for return notes — fetches lazily when needed.
  //     Returns createReturnNote function to refresh list after creation.
  const {
      returnNotes,
      loading:          loadingReturnNotes,
      error:            errorReturnNotes,
      createReturnNote,
  } = usePurchaseInvoiceReturnNotes(id);


    return (
        <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">

          {/* Header — invoice number + supplier.
              Show loading/error states while fetching invoice data. */}
          {loadingInvoice ? (
              <p className="text-[14px] text-slate-400 mb-4">Cargando factura...</p>
          ) : errorInvoice ? (
              <p className="text-[14px] text-red-400 mb-4">{errorInvoice}</p>
          ) : (
              <InvoiceDetailHeader invoice={invoice} />
          )}
 
          {/* Tab bar — switches between Products, Payments, and Return Notes */}
          <InvoiceDetailTabs activeTab={activeTab} onChange={setActiveTab} />

          {/* Conditional rendering of tab content based on activeTab */}
          {activeTab === "products" && (
              <ProductsTab
                  invoice={invoice}
                  loading={loadingInvoice}
                  error={errorInvoice}
              />
          )}

          {activeTab === "payments" && (
              <PaymentsTab
                  payments={payments}
                  invoice={invoice}
                  loading={loadingPayments}
                  error={errorPayments}
              />
          )}

          {activeTab === "returnNotes" && (
              <ReturnNotesTab
                  returnNotes={returnNotes}
                  invoice={invoice}
                  loading={loadingReturnNotes}
                  error={errorReturnNotes}
                  onCreated={createReturnNote}   // Refetch return notes after creating a new one
              />
          )}

        </div>
    );
}