import { useState, useEffect } from "react";
import { getPurchaseInvoiceById } from "@/lib/http/client/purchase-invoices.js";

// Fetches the full invoice detail (products + header info) for a given id.
// Used by the Productos tab and the page header.
export function usePurchaseInvoiceDetail(id) {
    // State to store the fetched invoice data
    const [invoice, setInvoice] = useState(null);
    // Loading flag: true while the request is in progress
    const [loading, setLoading] = useState(true);
    // Error state: holds error message if the request fails
    const [error,   setError]   = useState(null);

    // Effect runs whenever the `id` changes
    useEffect(() => {
        // Do nothing if no id is provided
        if (!id) return;

        // Cancellation flag to avoid setting state on unmounted component
        let cancelled = false;

        // Async function to fetch invoice data
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getPurchaseInvoiceById(id);
                // Only update state if component is still mounted
                if (!cancelled) setInvoice(data);
            } catch (e) {
                // Only update error state if still mounted
                if (!cancelled) setError(e.message);
            } finally {
                // Always turn off loading unless cancelled
                if (!cancelled) setLoading(false);
            }
        }

        // Execute the fetch
        load();

        // Cleanup: mark as cancelled when component unmounts or `id` changes
        return () => { cancelled = true; };
    }, [id]); // Re-run effect when `id` changes

    // Return the state values for use in components
    return { invoice, loading, error };
}