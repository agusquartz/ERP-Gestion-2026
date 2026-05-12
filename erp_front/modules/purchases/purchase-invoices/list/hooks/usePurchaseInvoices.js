import { useState, useEffect } from "react";
import { fetchPurchaseInvoices } from "../../../../../lib/http/client/purchase-invoices.js";

export function usePurchaseInvoices(filters) {
	const [invoices, setInvoices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);


	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);
			try {
				const data = await fetchPurchaseInvoices(filters);
				if (!cancelled) setInvoices(data);
			} catch(e) {
				if(!cancelled) setError(e.message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();
		return () => { cancelled = true; };

	}, [filters.search, filters.filter, filters.from, filters.to, filters.status]);

	return {invoices, loading, error };
}