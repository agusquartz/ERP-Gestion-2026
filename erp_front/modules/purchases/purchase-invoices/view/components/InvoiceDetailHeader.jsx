"use client";

// Header section of the invoice detail page.
// Shows the invoice number and supplier name — always visible regardless of active tab.
export function InvoiceDetailHeader({ invoice }) {
    // Guard clause: if no invoice data is provided, render nothing
    if (!invoice) return null;

    return (
        <div className="w-full mb-4 border-b border-slate-200 pb-3">
            {/* Main title: always displays "Purchase Invoice" followed by the invoice number */}
            <h1 className="text-[28px] font-extrabold leading-none tracking-tight text-foreground">
                Factura de Compra{" "}
                <span className="text-foreground">#{invoice.invoiceNr}</span>
            </h1>

            {/* Supplier information: shows the supplier's name with semantic styling */}
            <p className="mt-2 text-[14px] text-slate-500">
                Proveedor:{" "}
                <span className="font-semibold text-slate-700">
                    {invoice.supplier.name}
                </span>
            </p>
        </div>
    );
}