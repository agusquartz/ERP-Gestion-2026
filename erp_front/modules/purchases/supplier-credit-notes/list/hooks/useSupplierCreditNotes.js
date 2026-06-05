"use client";

import { useState, useEffect, useCallback } from "react";
// Usamos el servicio de proveedores correcto que me pasaste
import { listSupplierCreditNotes } from "@/lib/http/client/supplier-credit-notes"; 

const PAGE_SIZE = 5; // 20 notas de crédito por página

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

    // CAMBIO CLAVE: Usamos un objeto en lugar de un array para evitar problemas de desincronización.
    // La página 1 no necesita cursor, por eso es 'undefined'.
    const [cursors, setCursors] = useState({ 1: undefined });
    
    // Guardamos el número máximo de páginas que hemos "descubierto" al avanzar
    const [maxPageDiscovered, setMaxPageDiscovered] = useState(1);

    const debouncedSearch = useDebounce(filters.search, 400);
    const debouncedFilter = useDebounce(filters.filter, 400);

    // RESET GLOBAL: Si cambian los filtros de búsqueda, reseteamos la paginación por completo
    useEffect(() => {
        setCurrentPage(1);
        setMaxPageDiscovered(1);
        setCursors({ 1: undefined });
    }, [debouncedSearch, debouncedFilter, filters.since, filters.to]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                // 1. LEER EL CURSOR: Obtenemos el token guardado específicamente para la página actual
                const currentCursor = cursors[currentPage];

                const response = await listSupplierCreditNotes({
                    search: debouncedSearch || undefined,
                    filter: debouncedFilter || undefined,
                    since: filters.since || undefined,
                    to: filters.to || undefined,
                    cursor: currentCursor, // Enviamos el ID correspondiente a Rust
                    limit: PAGE_SIZE,
                });

                if (!cancelled) {
                    // Mapeamos según las propiedades de tu objeto Rust (camelCase en JS)
                    const fetchedData = response.creditNotes ?? []; 
                    const fetchedHasMore = response.hasMore ?? false;
                    const nextCursor = response.next_cursor ?? null;

                    setCreditNotes(fetchedData);
                    setHasMore(fetchedHasMore);

                    // LÓGICA EN EL FRONT: Extraemos el cursor desde el último elemento traído
                    if (fetchedHasMore && fetchedData.length > 0) {
                        const lastItem = fetchedData[fetchedData.length - 1];
                        const calculatedNextCursor = lastItem.id; // Tomamos el ID de la última nota de crédito

                        const nextPage = currentPage + 1;
                        
                        setCursors(prev => ({
                            ...prev,
                            [nextPage]: calculatedNextCursor // Registramos el cursor para usarlo al ir a 'nextPage'
                        }));

                        if (nextPage > maxPageDiscovered) {
                            setMaxPageDiscovered(nextPage);
                        }
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
        // CRUCIAL: Quitamos 'cursors' de las dependencias. 
        // Solo debe re-ejecutarse si cambia la página o los filtros.
    }, [currentPage, debouncedSearch, debouncedFilter, filters.since, filters.to]);

    // CORRECCIÓN CLAVE: Permitir saltos directos de página
    const goToPage = useCallback((page) => {
        // El usuario puede clickear libremente cualquier página ya descubierta (<= maxPageDiscovered)
        // o avanzar a la siguiente inmediata si hasMore es verdadero.
        if (page >= 1 && (page <= maxPageDiscovered || (page === currentPage + 1 && hasMore))) {
            setCurrentPage(page);
        }
    }, [currentPage, hasMore, maxPageDiscovered]);

    return {
        creditNotes,
        loading,
        error,
        currentPage,
        hasMore,
        // Enviamos las páginas descubiertas para que la enumeración funcione dinámicamente
        totalPages: maxPageDiscovered, 
        goToPage,
    };
}