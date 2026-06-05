import { useState, useEffect, useCallback } from "react";
import { createReturnNotes, getReturnNotes, getReturnNotesByInvoiceId } from "@/lib/http/client/return-notes.js";    

/**
 * Custom hook to fetch, manage, and create return notes for a specific invoice.
 * Encapsulates the loading/error state logic and ensures data synchronization 
 * after new note creation.
 */
export function usePurchaseInvoiceReturnNotes(id) {
    // State for the list of return notes
    const [returnNotes, setReturnNotes] = useState([]);
    // Loading flag: true while fetching
    const [loading,     setLoading]     = useState(true);
    // Error state: holds any error message
    const [error,       setError]       = useState(null);

    /**
     * Memoized 'load' function. 
     * Extracted from useEffect to be reachable by other functions (e.g., createReturnNote).
     * Uses useCallback to maintain a stable reference, preventing unnecessary 
     * re-triggering of effects that depend on this function.
     */
    const load = useCallback(async (isCancelled = () => false) => {
        if (!id) return;
        setLoading(true);
        setError(null);

        try {
            const data = await getReturnNotesByInvoiceId(id);
            // Only update state if component is still mounted
            if (!isCancelled()) setReturnNotes(data ?? []);
        } catch (e) {
            if (!isCancelled()) {
                setReturnNotes([]);
                setError(null); // Suppress error for missing notes
            }
        } finally {
            if (!isCancelled()) setLoading(false);
        }
    }, [id]);

    /**
     * Effect to trigger the initial fetch whenever the invoice ID changes.
     * It relies on the memoized 'load' function to keep the effect logic clean.
     */
    useEffect(() => {
        let cancelled = false;

        // Execute fetch and pass a closure to check for cleanup/unmount
        load(() => cancelled);

        return () => { 
            cancelled = true; 
        };
    }, [load]); 

    /**
     * Handler to create a new return note.
     * Refreshes the data list automatically upon success by calling the memoized 'load'.
     */
    const createReturnNote = useCallback(async (payload) => {
        await createReturnNotes(payload);
        // Sync the state with the server after a successful mutation
        await load(); 
        return { ok: true };
    }, [load]); 

    return { returnNotes, loading, error, createReturnNote };
}
