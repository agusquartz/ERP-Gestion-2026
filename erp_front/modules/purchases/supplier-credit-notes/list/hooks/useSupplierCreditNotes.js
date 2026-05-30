"use client";

import { useState, useEffect, useCallback } from "react";
import { listSupplierCreditNotes } from "@/lib/http/client/supplier-credit-notes"; // Tu endpoint HTTP

const PAGE_SIZE = 20; // 20 notas de crédito por página

function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export function useSupplierCreditNotes(filters) {
    const [creditNotes, setCreditNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Tabla de mapeo de cursores: cursors[0] es undefined para la página 1
    const [cursors, setCursors] = useState([undefined]);

    const debouncedSearch = useDebounce(filters.search, 400);
    const debouncedFilter = useDebounce(filters.filter, 400);

    // Si los filtros cambian, volvemos inmediatamente a la página 1 y limpiamos el historial de cursores
    useEffect(() => {
        setCurrentPage(1);
        setCursors([undefined]);
    }, [debouncedSearch, debouncedFilter, filters.since, filters.to]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                // Recuperar el cursor correspondiente a la página actual
                const cursor = cursors[currentPage - 1];

                // Adaptamos las variables a lo que espera el endpoint
                const response = await listSupplierCreditNotes({
                    search: debouncedSearch || undefined,
                    filter: debouncedFilter || undefined,
                    since: filters.since || undefined,
                    to: filters.to || undefined,
                    cursor: cursor,
                    limit: PAGE_SIZE,
                });

                if (!cancelled) {
                    // Rust suele retornar la data envuelta en response.data o directo en la raíz.
                    // Si tu endpoint devuelve el arreglo directo, cámbialo a: response || []
                    const fetchedData = response.creditNotes ?? []; 
                    const fetchedHasMore = response.hasMore ?? false;

                    setCreditNotes(fetchedData);
                    setHasMore(fetchedHasMore);

                    // Si hay más registros y el backend proveyó un nuevo puntero, lo indexamos
                    if (fetchedHasMore && response.nextCursor != null) {
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
    }, [currentPage, cursors, debouncedSearch, debouncedFilter, filters.since, filters.to]);

    const goToPage = useCallback((page) => {
        if (page >= 1 && (page < currentPage || cursors[page - 1] != null || page === 1)) {
            setCurrentPage(page);
        }
    }, [currentPage, cursors]);

    return {
        creditNotes,
        loading,
        error,
        currentPage,
        hasMore,
        totalPages: cursors.length,
        goToPage,
    };
}
