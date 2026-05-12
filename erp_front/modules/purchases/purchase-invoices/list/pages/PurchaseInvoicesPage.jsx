"use client";

import { useState } from "react";
import { InvoiceFilters } from "../components/InvoiceFilters";
import { InvoiceTable } from "../components/InvoiceTable";
import { usePurchaseInvoices } from "../hooks/usePurchaseInvoices";

export function  PurchaseInvoicesPage() {
	const [filters, setFilters] = useState({
		search: 	"",
		filter: 	"",
		from: 		"",
		to: 		"",
		status: 	"",
	});

	const { invoices, loading, error } = usePurchaseInvoices(filters);

	return(
	  <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
	  	<h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[34px]">
	  		Facturas de Compra
	  	</h1>
	  	
	  	<InvoiceFilters onSearch={setFilters} />

	  	<div>
	  		<p className="text-[13px] text-slate-400">
	  			Mostrando {invoices.length} resultado{invoices.length !== 1 ? "s" : ""}
	  		</p>
	  	</div>

	  	<InvoiceTable invoices={invoices} loading={loading} error={error} />
	  </div>
	);
}
