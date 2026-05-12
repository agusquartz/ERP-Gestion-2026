import { useState, useEffect } from "react";
import { fetchPurchaseInvoices } from "../../../../../lib/http/client/purchase-invoices.js";

function useDebounce(value, delay = 400) {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	},[value, delay]);

	return debounced;
}

export function usePurchaseInvoices(filters) {
	const [invoices, setInvoices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const debouncedSearch = useDebounce(filters.search, 400);
	const debouncedFilter = useDebounce(filters.filter, 400);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);
			try {
				const data = await fetchPurchaseInvoices({
					search: debouncedSearch,
					filter: debouncedFilter,
					from:   filters.from,
          			to:     filters.to,
          			status: filters.status,
				});
				if (!cancelled) setInvoices(data);
			} catch(e) {
				if(!cancelled) setError(e.message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();
		return () => { cancelled = true; };

	}, [debouncedSearch, debouncedFilter, filters.from, filters.to, filters.status]);

	return {invoices, loading, error };
}