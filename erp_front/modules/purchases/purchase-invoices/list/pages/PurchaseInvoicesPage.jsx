"use client";

import { useState } from "react";
import { InvoiceFilters } from "../components/InvoiceFilters";
import { InvoiceTable } from "../components/InvoiceTable";
import { Pagination } from "../components/Pagination";
import { usePurchaseInvoices } from "../hooks/usePurchaseInvoices";

const INITIAL_FILTERS = {
    search: "",
    filter: "",
    status: "",
    from:   "",
    to:     "",
};

export function PurchaseInvoicesPage() {
    const [filters, setFilters] = useState(INITIAL_FILTERS);

    const {
        invoices,
        loading,
        error,
        currentPage,
        hasMore,
        totalPages,
        goToPage,
    } = usePurchaseInvoices(filters);

    return (
        <div className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-24px)] md:h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:p-4 md:p-6">
        <div className= "mb-5">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
                Facturas de Compra
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
                 Consultá facturas, presupuestos y notas de crédito.
            </p>
            <div className="mt-2 h-px w-full bg-border" />
        </div>
            <InvoiceFilters onSearch={setFilters} />
            
            <InvoiceTable invoices={invoices} loading={loading} error={error} />

            {/* Pagination — only shown when there is more than one page */}
            {!loading && !error && (totalPages > 1 || hasMore) && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    hasMore={hasMore}
                    goToPage={goToPage}
                />
            )}
        </div>
    );
}