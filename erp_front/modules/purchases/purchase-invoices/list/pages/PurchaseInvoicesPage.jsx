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
        <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
            <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[34px]">
                Facturas de Compra
            </h1>

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