import { useState, useEffect, useCallback } from "react";
import { createReturnNotes, getReturnNotes } from "@/lib/http/client/return-notes.js";    

// Fetches and manages return notes for a given invoice.
// Used by the "Notas de Devolución" tab.
export function usePurchaseInvoiceReturnNotes(id) {
    // State for the list of return notes
    const [returnNotes, setReturnNotes] = useState([]);
    // Loading flag: true while fetching
    const [loading,     setLoading]     = useState(true);
    // Error state: holds any error message
    const [error,       setError]       = useState(null);

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
                const data = await getReturnNotes(id);
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
        await createReturnNotes(payload);
        await load(); // Calls the outer load? Actually calls the one in scope?
        return { ok: true };
    }, [id]);

    return { returnNotes, loading, error, createReturnNote };
}