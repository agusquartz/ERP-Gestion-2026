"use client";

import { useState } from "react";
import { InvoiceFilters } from "../components/InvoiceFilters";
import { InvoiceTable } from "../components/InvoiceTable";
import { usePurchaseInvoices } from "../hooks/usePurchaseInvoices";

// Shape matches exactly what the backend query params expect:
// search, status, from, to, cursor, limit
const INITIAL_FILTERS = {
	search: "",
	filter: "",
	status: "",
	from:   "",
	to:     "",
};

export function PurchaseInvoicesPage() {
	const [filters, setFilters] = useState(INITIAL_FILTERS);

	const { invoices, total, loading, error } = usePurchaseInvoices(filters);

	return (
		<div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
			<h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[34px]">
				Facturas de Compra
			</h1>

			<InvoiceFilters onSearch={setFilters} />

			<div>
				<p className="text-[13px] text-slate-400">
					Mostrando {total} resultado{total !== 1 ? "s" : ""}
				</p>
			</div>

			<InvoiceTable invoices={invoices} loading={loading} error={error} />
		</div>
	);
}