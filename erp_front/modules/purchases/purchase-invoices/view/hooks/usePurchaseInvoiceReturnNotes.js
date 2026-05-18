import { useState, useEffect, useCallback } from "react";
import { getReturnNotesByQuery } from "@/lib/http/client/return-notes.js";
// NOTE: createPurchaseInvoiceReturnNote is not imported in the original code.
// The hook references it inside createReturnNote but it's missing.
// We'll comment as provided.

// Fetches and manages return notes for a given invoice.
// Used by the "Notas de Devolución" tab.
export function usePurchaseInvoiceReturnNotes(id) {
    // State for the list of return notes
    const [returnNotes, setReturnNotes] = useState([]);
    // Loading flag: true while fetching
    const [loading,     setLoading]     = useState(true);
    // Error state: holds any error message
    const [error,       setError]       = useState(null);

    // --- OUTER load function defined but never used (duplicate).
    // The actual fetch logic is inside useEffect.
    async function load() {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getReturnNotesByQuery(id);
            setReturnNotes(data ?? []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    // Effect runs when invoice id changes
    useEffect(() => {
        // Cancellation flag to prevent state updates on unmounted component
        let cancelled = false;

        // Inner load function (shadows the outer one)
        async function load() {
            if (!id) return;
            setLoading(true);
            setError(null);

            try {
                const data = await getReturnNotesByQuery(id);
                // Only update if component is still mounted
                if (!cancelled) setReturnNotes(data ?? []);
            } catch (e) {
                if (!cancelled) {
                    setReturnNotes([]);
                    setError(null);   // Suppress error for missing notes
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        // Execute the fetch
        load();
        // Cleanup: mark cancelled on unmount or id change
        return () => { cancelled = true; };
    }, [id]); // Re-run when `id` changes

    // Creates a new return note and refreshes the list on success.
    // Returns { ok: true } or throws so the modal can handle the error.
    // NOTE: createPurchaseInvoiceReturnNote is not defined in this scope.
    const createReturnNote = useCallback(async (payload) => {
        await createPurchaseInvoiceReturnNote(id, payload); // Missing import/definition
        await load(); // Calls the outer load? Actually calls the one in scope?
        return { ok: true };
    }, [id]);

    return { returnNotes, loading, error, createReturnNote };
}