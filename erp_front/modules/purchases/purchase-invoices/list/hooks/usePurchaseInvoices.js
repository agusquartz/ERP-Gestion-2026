import { useState, useEffect, useCallback } from "react";
import { fetchPurchaseInvoices } from "../../../../../lib/http/client/purchase-invoices.js";

const PAGE_SIZE = 30;

function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export function usePurchaseInvoices(filters) {
    const [invoices,    setInvoices]    = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore,     setHasMore]     = useState(false);

    // cursors[i] = the cursor to request page i+1.
    // cursors[0] = undefined  → page 1 (no cursor, start from beginning)
    // cursors[1] = id_30      → page 2
    // cursors[2] = id_60      → page 3
    // etc.
    const [cursors, setCursors] = useState([undefined]);

    const debouncedSearch = useDebounce(filters.search, 400);
    const debouncedFilter = useDebounce(filters.filter, 400);

    // When filters change, reset everything to page 1
    useEffect(() => {
        setCurrentPage(1);
        setCursors([undefined]);
    }, [debouncedSearch, debouncedFilter, filters.status, filters.from, filters.to]);

    // Fetch whenever page or filters change
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const cursor = cursors[currentPage - 1];

                const response = await fetchPurchaseInvoices({
                    search:  debouncedSearch || undefined,
                    filter:  debouncedFilter || undefined,
                    status:  filters.status  || undefined,
                    from:    filters.from    || undefined,
                    to:      filters.to      || undefined,
                    cursor:  cursor,
                    limit:   PAGE_SIZE,
                });

                if (!cancelled) {
                    setInvoices(response.data ?? []);
                    setHasMore(response.hasMore ?? false);

                    // Store the cursor for the next page only if we don't have it yet.
                    // This way going back and forward works correctly.
                    if (response.hasMore && response.nextCursor != null) {
                        setCursors(prev => {
                            if (prev[currentPage] == null) {
                                const next = [...prev];
                                next[currentPage] = response.nextCursor;
                                return next;
                            }
                            return prev;
                        });
                    }
                }
            } catch (e) {
                if (!cancelled) setError(e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };

    }, [currentPage, cursors, debouncedSearch, debouncedFilter, filters.status, filters.from, filters.to]);

    const goToPage = useCallback((page) => {
        // Can only go forward if we have the cursor for that page
        if (page >= 1 && (page < currentPage || cursors[page - 1] != null || page === 1)) {
            setCurrentPage(page);
        }
    }, [currentPage, cursors]);

    return {
        invoices,
        loading,
        error,
        currentPage,
        hasMore,
        totalPages: cursors.length, // number of pages we know exist so far
        goToPage,
    };
}