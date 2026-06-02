
"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { listQuotes, getQuoteById } from "@/lib/http/client/quotes";
import { QuoteDetailsModal } from "../modals/documents/QuoteDetailsModal";
import { DocumentsHeader } from "../components/documents/DocumentsHeader";
import { DocumentsSearch } from "../components/documents/DocumentsSearch";
import { DocumentsTable } from "../components/documents/DocumentsTable";
import { ActionButton } from "../components/documents/ButtonActions";
import { NewCreditNoteModal } from "../modals/documents/NewCreditNoteModal";
import { InvoiceDetailsModal } from "../modals/documents/InvoiceDetailsModal";

import { listInvoices, getInvoiceById } from "@/lib/http/client/invoices";
import { listCreditNotes } from "@/lib/http/client/credit-notes";

const DOCUMENT_TYPES = {
    INVOICE: "Facturas",
    QUOTE: "Presupuesto",
    CREDIT_NOTE: "Notas de Credito"
}

function quoteToDocument(quote) {
  return {
    id: quote.id,
    type: "Presupuesto",
    date: quote.createdAt,
    invoice_number: `P-${String(quote.id).padStart(3, "0")}`,
    client: `${quote.client.name} ${quote.client.surname}`,
    status: quote.status.name,
    total: Number(quote.total),
    details: quote.details,
  };
}

function invoiceToDocument(invoice) {
  return {
    id: invoice.id,
    type: DOCUMENT_TYPES.INVOICE,
    date: invoice.date,
    invoice_number: invoice.invoiceNumber,
    client: `${invoice.client.name} ${invoice.client.surname}`,
    total: Number(invoice.total),

    // Datos extra útiles para modales
    createdAt: invoice.createdAt,
    expirationDate: invoice.expirationDate,
    totalPaid: Number(invoice.totalPaid),
    saleCondition: invoice.saleCondition,
    quoteId: invoice.quoteId,
    raw: invoice,

    // Adaptado para tu NewCreditNoteModal actual
    items: invoice.details.map((detail) => ({
      productId: detail.product.id,
      code: detail.product.code,
      description: detail.product.description,
      OriginalQty: detail.quantity,
      unitPrice: Number(detail.unitCost),
      tax: Number(detail.tax),
    })),
  };
}

function creditNoteToDocument(creditNote) {
  return {
    id: creditNote.id,
    type: DOCUMENT_TYPES.CREDIT_NOTE,
    date: creditNote.createdAt,
    number_credite_note: creditNote.creditNoteNumber,
    invoice_number: creditNote.invoice.invoiceNumber,
    invoiceId: creditNote.invoice.id,
    total: Number(creditNote.total),

    // Tu CreditNoteResponse no trae cliente.
    // Por eso no podemos mostrar el nombre real del cliente todavía.
    client: "No disponible",

    raw: creditNote,
    details: creditNote.details,
  };
}

export default function DocumentsPage() {
const router = useRouter();
const [activeTab, setActiveTab] = useState(DOCUMENT_TYPES.INVOICE);
const [selectedId, setSelectedId] = useState(null);
const [isCreatingCreditNote, setIsCreatingCreditNote] = useState(false);
const [viewingInvoice, setViewingInvoice] = useState(null); // Estado para el modal de detalles

const [quoteSearch, setQuoteSearch] = useState("");
const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
const [quotesError, setQuotesError] = useState(null);

const [viewingQuote, setViewingQuote] = useState(null);
const [isLoadingQuoteDetails, setIsLoadingQuoteDetails] = useState(false);

const [documents, setDocuments] = useState([]);
const [search, setSearch] = useState("");
const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
const [documentsError, setDocumentsError] = useState(null);

useEffect(() => {
  if (activeTab !== DOCUMENT_TYPES.QUOTE) return;

  let ignore = false;

  async function loadQuotes() {
    try {
      setIsLoadingQuotes(true);
      setQuotesError(null);

      const quotes = await listQuotes({ contains: quoteSearch });

      if (ignore) return;

      const quoteDocuments = quotes.map(quoteToDocument);

      setDocuments((prev) => {
        const documentsWithoutQuotes = prev.filter(
          (doc) => doc.type !== DOCUMENT_TYPES.QUOTE
        );

        return [...documentsWithoutQuotes, ...quoteDocuments];
      });
    } catch (error) {
      if (!ignore) {
        setQuotesError(error.message);
      }
    } finally {
      if (!ignore) {
        setIsLoadingQuotes(false);
      }
    }
  }

  const timeoutId = setTimeout(loadQuotes, 300);

  return () => {
    ignore = true;
    clearTimeout(timeoutId);
  };
}, [activeTab, quoteSearch]);


const handleAction = () => {
    if (!selectedId) return; // If nothing is selected, we do nothing.

    if (activeTab === DOCUMENT_TYPES.INVOICE) {
      setIsCreatingCreditNote(true);
    } 
    //Logic for Budget Redirection
    else if (activeTab === DOCUMENT_TYPES.QUOTE) {
      router.push(`/sales/new?quote_id=${selectedId}`);
    }
};

useEffect(() => {
  let ignore = false;

  async function loadDocuments() {
    try {
      setIsLoadingDocuments(true);
      setDocumentsError(null);

      let data = [];
      let mapped = [];

      if (activeTab === DOCUMENT_TYPES.INVOICE) {
        data = await listInvoices({ contains: search });
        mapped = data.map(invoiceToDocument);
      }

      if (activeTab === DOCUMENT_TYPES.QUOTE) {
        data = await listQuotes({ contains: search });
        mapped = data.map(quoteToDocument);
      }

      if (activeTab === DOCUMENT_TYPES.CREDIT_NOTE) {
        data = await listCreditNotes({ contains: search });
        mapped = data.map(creditNoteToDocument);
      }

      if (!ignore) {
        setDocuments(mapped);
      }
    } catch (error) {
      if (!ignore) {
        setDocumentsError(error.message);
      }
    } finally {
      if (!ignore) {
        setIsLoadingDocuments(false);
      }
    }
  }

  const timeoutId = setTimeout(loadDocuments, 300);

  return () => {
    ignore = true;
    clearTimeout(timeoutId);
  };
}, [activeTab, search]);


// Function to open the viewfinder
const handleView = async (id) => {
  try {
    if (activeTab === DOCUMENT_TYPES.INVOICE) {
      const invoice = await getInvoiceById(id);
      setViewingInvoice(invoiceToDocument(invoice));
      return;
    }

    if (activeTab === DOCUMENT_TYPES.QUOTE) {
      const quote = await getQuoteById(id);
      setViewingQuote(quoteToDocument(quote));
      return;
    }

    if (activeTab === DOCUMENT_TYPES.CREDIT_NOTE) {
      // Por ahora, si no tenés modal de nota de crédito,
      // podés solo leerla y mostrarla en consola.
      // Más adelante hacemos CreditNoteDetailsModal.
      console.log("Credit note selected:", id);
      return;
    }
  } catch (error) {
    alert(`Error al cargar el documento: ${error.message}`);
  }
};

const handleCreateInvoiceFromQuote = () => {
  if (!viewingQuote?.id) return;

  router.push(`/sales/new?quote_id=${viewingQuote.id}`);
};

const filteredDocuments = documents;

//Search for the complete invoice item in the list using the selected ID
const selectedInvoice = documents.find(doc => doc.id === selectedId);
    
  return (
    
     <div className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-24px)] md:h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px] ">
          Buscar Documentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultá facturas, presupuestos y notas de crédito.
       </p>
        <div className="mt-2 h-px w-full bg-border" />
      </div>
      <DocumentsHeader 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedId(null);
        }}
/>

      <DocumentsSearch 
        activeTab={activeTab}
        onSearch={setSearch}
      />
      {isLoadingQuoteDetails && activeTab === DOCUMENT_TYPES.QUOTE && (
        <p className="mb-2 text-sm text-slate-500">
          Cargando detalle del presupuesto...
        </p>
      )}

      {isLoadingQuotes && activeTab === DOCUMENT_TYPES.QUOTE && (
        <p className="text-sm text-slate-500">Cargando presupuestos...</p>
      )}

      {quotesError && activeTab === DOCUMENT_TYPES.QUOTE && (
        <p className="text-sm text-red-500">
          Error al cargar presupuestos: {quotesError}
        </p>
      )}
      <DocumentsTable
        type={activeTab}
        documents={documents}
        onView={handleView}
        onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
      />
      <div className= "flex justify-end items-center h-20">
          {activeTab!== DOCUMENT_TYPES.CREDIT_NOTE && (
              <ActionButton 
                //if something is selected: blue, if nothing is selected: gray
                variant={selectedId  !== null ? "primary" : "tertiary"} 
                type= {activeTab}
                onClick={handleAction}
              />

          )}
      </div>
       {/* modal: new credit note, rendering when isCreatingNote is true*/}
      {isCreatingCreditNote && (
        <NewCreditNoteModal
          isOpen={isCreatingCreditNote}
          onClose={() => setIsCreatingCreditNote(false)}
          invoiceId={selectedInvoice?.id}
          invoiceNumber={selectedInvoice?.invoice_number}
          items={selectedInvoice?.items}
          onCreated={() => {
            setIsCreatingCreditNote(false);
          }}
        />
      )}
      <InvoiceDetailsModal 
        isOpen={!!viewingInvoice} 
        onClose={() => setViewingInvoice(null)} 
        invoice={viewingInvoice}
        onCreateCreditNote={ () => setIsCreatingCreditNote(true)}
      />

      <QuoteDetailsModal
        isOpen={!!viewingQuote}
        onClose={() => setViewingQuote(null)}
        quote={viewingQuote}
        onCreateInvoice={handleCreateInvoiceFromQuote}
      />



    </div>
   
  );
}