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
  CREDIT_NOTE: "Notas de Credito",
};

function quoteToDocument(quote) {
  return {
    id: quote.id,
    type: DOCUMENT_TYPES.QUOTE,
    date: quote.createdAt,
    invoice_number: `P-${String(quote.id).padStart(3, "0")}`,
    client: `${quote.client.name} ${quote.client.surname}`,
    status: quote.status?.name ?? "",
    total: Number(quote.total),
    details: quote.details ?? [],
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

    createdAt: invoice.createdAt,
    expirationDate: invoice.expirationDate,
    totalPaid: Number(invoice.totalPaid),
    saleCondition: invoice.saleCondition,
    quoteId: invoice.quoteId,
    raw: invoice,

    items: (invoice.details ?? []).map((detail) => ({
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
    client: `${creditNote.client.name} ${creditNote.client.surname}`,
    raw: creditNote,
    details: creditNote.details ?? [],
  };
}

function matchesDateFilter(docDate, filter) {
  if (!filter.type || !docDate) return true;

  const date = new Date(docDate + "T00:00:00");
  const now = new Date();

  if (filter.type === "Hoy") {
    return date.toDateString() === now.toDateString();
  }
  if (filter.type === "Esta Semana") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek;
  }
  if (filter.type === "Este Mes") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  if (filter.type === "custom" && filter.date) {
    return docDate === filter.date;
  }
  return true;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(DOCUMENT_TYPES.INVOICE);
  const [selectedId, setSelectedId] = useState(null);
  const [isCreatingCreditNote, setIsCreatingCreditNote] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  const [viewingQuote, setViewingQuote] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [filterTotal, setFilterTotal] = useState("");
  const [dateFilter, setDateFilter] = useState({ type: "", date: "" });
  const [statusFilter, setStatusFilter] = useState("");

  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);

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
          mapped = data.invoices.map(invoiceToDocument);
        } else if (activeTab === DOCUMENT_TYPES.QUOTE) {
          data = await listQuotes({ contains: search });
          mapped = data.quotes.map(quoteToDocument);
        } else if (activeTab === DOCUMENT_TYPES.CREDIT_NOTE) {
          data = await listCreditNotes({ contains: search });
          mapped = data.creditNotes.map(creditNoteToDocument);
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

  const handleAction = () => {
    if (!selectedId) return;

    if (activeTab === DOCUMENT_TYPES.INVOICE) {
      setIsCreatingCreditNote(true);
    } else if (activeTab === DOCUMENT_TYPES.QUOTE) {
      router.push(`/sales/new?quote_id=${selectedId}`);
    }
  };

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
        console.log("Credit note selected:", id);
        return;
      }
    } catch (error) {
      alert(`Error al cargar el documento: ${error.message}`);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (filterTotal.trim()) {
      const q = filterTotal.trim().toLowerCase();
      const matchesTotal = String(doc.total ?? "").includes(q);
      const matchesInvoiceNr = (doc.invoice_number ?? "").toLowerCase().includes(q);
      if (!matchesTotal && !matchesInvoiceNr) return false;
    }

    if (activeTab === DOCUMENT_TYPES.QUOTE && statusFilter.trim()) {
      if ((doc.status ?? "").toLowerCase() !== statusFilter.trim().toLowerCase()) {
        return false;
      }
    }

    if (!matchesDateFilter(doc.date, dateFilter)) return false;

    return true;
  });

  const selectedInvoice = documents.find((doc) => doc.id === selectedId);

  const quoteStatusOptions = Array.from(
    new Set(
      documents
        .filter((doc) => doc.type === DOCUMENT_TYPES.QUOTE)
        .map((doc) => doc.status)
        .filter(Boolean)
        .map((s) => String(s))
    )
  );

  return (
<<<<<<< feature/KAN-71-centralize-frontend-styling
    
     <div className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-24px)] md:h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:p-4 md:p-6">
=======
    <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
>>>>>>> develop
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
          setFilterTotal("");
          setDateFilter({ type: "", date: "" });
          setStatusFilter("");
          setSearch("");
        }}
      />

      <DocumentsSearch
        activeTab={activeTab}
        onSearch={setSearch}
        onFilterTotal={setFilterTotal}
        onDateFilter={setDateFilter}
        onStatusFilter={setStatusFilter}
        statusOptions={quoteStatusOptions}
      />

      {documentsError && (
        <p className="text-sm text-red-500">
          Error al cargar documentos: {documentsError}
        </p>
      )}

      {isLoadingDocuments && (
        <p className="text-sm text-slate-500">Cargando documentos...</p>
      )}

      <DocumentsTable
        type={activeTab}
        documents={filteredDocuments}
        onView={handleView}
        onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
      />

      <div className="flex justify-end items-center h-20">
        {activeTab !== DOCUMENT_TYPES.CREDIT_NOTE && (
          <ActionButton
            variant={selectedId !== null ? "primary" : "tertiary"}
            type={activeTab}
            onClick={handleAction}
          />
        )}
      </div>

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
        onCreateCreditNote={() => setIsCreatingCreditNote(true)}
      />

      <QuoteDetailsModal
        isOpen={!!viewingQuote}
        onClose={() => setViewingQuote(null)}
        quote={viewingQuote}
        onCreateInvoice={() => {
          if (viewingQuote?.id) router.push(`/sales/new?quote_id=${viewingQuote.id}`);
        }}
      />
    </div>
  );
}
