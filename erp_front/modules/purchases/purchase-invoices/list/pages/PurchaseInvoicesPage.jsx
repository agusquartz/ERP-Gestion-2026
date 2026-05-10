"use client";

import { useState } from "react";
import { InvoiceFilters } from "../components/InvoiceFilters";
import { InvoiceTable } from "../components/InvoiceTable";
import { usePurchaseInvoices } from "../hooks/usePurchaseInvoices";

export function  PurchaseInvoicesPage() {
	const [filters, setFilters] = useState({
		search: "",
		from: 	"",
		to: 	"",
		status: "",
	});

	const { invoices, loading, error } = usePurchaseInvoices(filters);

	return(
	  <div className="flex flex-col gap-6 p-6">
	  	<div>
	  		<h1 className="text-[22px] font-bold text-slate-800">Facturas de Compra</h1>
	  		<p className="text-[13px] text-slate-400 mt-1">
	  			Mostrando {invoices.length} resultado{invoices.length !== 1 ? "s" : ""}
	  		</p>
	  	</div>

	  	<InvoiceFilters onSearch={setFilters} />
	  	<InvoiceTable invoices={invoices} loading={loading} error={error} />
	  </div>
	);
}