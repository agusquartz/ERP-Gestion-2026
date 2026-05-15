import { useState, useEffect } from "react";
import { fetchPurchaseInvoices } from "../../../../../lib/http/client/purchase-invoices.js";

// Generic debounce hook — delays updating a value until the user stops typing
function useDebounce(value, delay = 400) {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}

export function usePurchaseInvoices(filters) {
	const [invoices, setInvoices] = useState([]);
	const [total,    setTotal]    = useState(0);
	const [loading,  setLoading]  = useState(true);
	const [error,    setError]    = useState(null);

	// Only search is debounced — date and status changes are instant
	const debouncedSearch = useDebounce(filters.search, 400);
	const debouncedFilter = useDebounce(filters.filter, 400);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);

			try {
				// fetchPurchaseInvoices builds the query string from these params.
				// The backend returns { data, nextCursor, hasMore } — we only
				// use data here since pagination is not yet wired to the UI.
				const response = await fetchPurchaseInvoices({
					search:  debouncedSearch || undefined,
					filter:  debouncedFilter || undefined,
					status:  filters.status  || undefined,
					from:    filters.from    || undefined,
					to:      filters.to      || undefined,
				});

				if (!cancelled) {
					// response.data is the array of invoices from the paginated envelope
					setInvoices(response.data ?? []);
					setTotal(response.data?.length ?? 0);
				}
			} catch (e) {
				if (!cancelled) setError(e.message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();
		return () => { cancelled = true; };

	// filter and status are not debounced — they trigger immediately
	}, [debouncedSearch, debouncedFilter, filters.status, filters.from, filters.to]);

	return { invoices, total, loading, error };
}