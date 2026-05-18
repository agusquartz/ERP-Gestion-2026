import { useState, useEffect } from "react";
import { getPurchasePaymentOrders } from "@/lib/http/client/purchase-payment-order.js";

// Fetches the payment orders associated with a given invoice id.
// Used by the "Pagos de la Factura" tab.
export function usePurchaseInvoicePayments(invoice) {
    // State for the list of payment orders
    const [payments, setPayments] = useState([]);
    // Loading flag: true while fetching
    const [loading,  setLoading]  = useState(true);
    // Error state: holds any error message
    const [error,    setError]    = useState(null);

    // Effect runs when the invoice number changes (invoice object may be null initially)
    useEffect(() => {
        // Wait until we have a valid invoice number before fetching
        if (!invoice?.invoiceNr) return;

        // Cancellation flag to prevent state updates if component unmounts
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getPurchasePaymentOrders(invoice.invoiceNr);
                // Update payments only if component is still mounted
                if (!cancelled) setPayments(data ?? []);
            } catch (e) {
                // If fetch fails (e.g., 404 or no payments found), log warning but
                // treat as empty list instead of showing error to the user.
                if (!cancelled) {
                    console.warn("Not fount payments");
                    setPayments([]);
                    setError(null);   // Clear any previous error, don't show error UI
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        // Cleanup: mark cancelled on unmount or when invoiceNr changes
        return () => { cancelled = true; };
    }, [invoice?.invoiceNr]); // Re-run when the invoice number changes

    return { payments, loading, error };
}