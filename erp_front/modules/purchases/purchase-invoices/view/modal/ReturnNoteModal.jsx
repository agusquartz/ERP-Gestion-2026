"use client";

import { useState } from "react";

// Modal for creating a new return note.
// Layout: product table on the left with "Cantidad a Devolver" inputs,
//         "Razon de la Devolucion" textarea on the right.
//
// On "Guardar":
// - Filters out items where quantityToReturn === 0
// - Sends { motive, items: [{ productId, quantityToReturn }] } to onSaved
//
// The parent (ReturnNotesTab) calls createReturnNote and refreshes the list.
export function ReturnNoteModal({ invoice, onClose, onSaved }) {
    // Extract invoice line items (products with quantities, prices)
    const details = invoice?.details ?? [];

    // State: quantity to return per product, keyed by product.id. Default 0 for each.
    const [quantities, setQuantities] = useState(
        Object.fromEntries(details.map(d => [d.product.id, 0]))
    );
    const [motive,   setMotive]   = useState("");   // Return reason text
    const [saving,   setSaving]   = useState(false); // Disable buttons during save
    const [error,    setError]    = useState(null);  // Validation or API error

    // Update quantity for a specific product, ensuring non-negative integer.
    function setQty(productId, value) {
        const parsed = parseInt(value, 10);
        setQuantities(prev => ({
            ...prev,
            [productId]: isNaN(parsed) || parsed < 0 ? 0 : parsed,
        }));
    }

    // Validate and submit the return note.
    async function handleSave() {
        // Reason is mandatory
        if (!motive.trim()) {
            setError("La razón de la devolución es obligatoria.");
            return;
        }

        // Build items array for products with quantity > 0
        const items = details
            .filter(d => quantities[d.product.id] > 0)
            .map(d => {
                const qty = quantities[d.product.id];
                return {
                    productId:        d.product.id,
                    quantityToReturn: qty,
                    amount:           Number(d.unitCost) * qty, // Calculated subtotal
                };
            });

        // At least one product must have a positive quantity
        if (items.length === 0) {
            setError("Ingresá al menos una cantidad a devolver.");
            return;
        }

        // Payload expected by the parent's onSaved (which calls the API)
        const payload = {
                purchaseInvoiceId: invoice.id,
                motive:            motive.trim(), 
                createdAt:         null,        // Server will assign creation date
                details:           items,
        };

        setSaving(true);
        setError(null);
        try {
            await onSaved(payload);   // onSaved should be the createReturnNote function
            // onClose and refresh happen in parent's onSaved callback
        } catch (e) {
            setError(e.message ?? "Error al guardar.");
            setSaving(false);
        }
    }

    return (
        // Full-screen backdrop with semi-transparent black background
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            {/* Modal container: fixed width, white background, rounded corners */}
            <div className="w-full max-w-[1000px] h-[500px] rounded-[10px] bg-white shadow-2xl p-6 flex flex-col">

                {/* Modal header: title and supplier name */}
                <div className="mb-4">
                    <h2 className="text-[20px] font-bold text-slate-800">Nueva Nota de Devolucion</h2>
                    <p className="text-[13px] text-slate-500">
                        Proveedor: {invoice?.supplier?.name ?? "—"}
                    </p>
                </div>

                {/* Main two-column layout: product table (left) + reason textarea (right) */}
                <div className="flex gap-6 flex-1 min-h-0">

                    {/* LEFT: Product table with editable return quantities */}
                    <div className="flex-1 overflow-auto rounded-[5px] border border-slate-200">
                        <table className="w-full text-[13px] text-slate-700">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cantidad</th>
                                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cantidad a Devolver</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {details.map((item, i) => (
                                    <tr key={item.product.id}>
                                        {/* Row number */}
                                        <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
                                        {/* Product code */}
                                        <td className="px-3 py-2.5 font-medium">{item.product.code}</td>
                                        {/* Product name (truncated) */}
                                        <td className="px-3 py-2.5 text-slate-600 max-w-[160px] truncate">{item.product.name}</td>
                                        {/* Original invoice quantity */}
                                        <td className="px-3 py-2.5 text-right">{item.quantity}</td>
                                        {/* Unit price */}
                                        <td className="px-3 py-2.5 text-right">
                                            $ {Number(item.unitCost).toLocaleString("es-PY")}
                                        </td>
                                        {/* Number input for quantity to return, limited by original quantity */}
                                        <td className="px-3 py-2.5 text-center">
                                            <input
                                                type="number"
                                                min={0}
                                                max={item.quantity}
                                                value={quantities[item.product.id]}
                                                onChange={e => setQty(item.product.id, e.target.value)}
                                                className="w-16 rounded-[5px] border border-slate-200 px-2 py-1 text-center text-[13px] outline-none focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* RIGHT: Reason textarea */}
                    <div className="w-[200px] shrink-0 flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-slate-700">
                            Razon de la Devolucion
                        </label>
                        <textarea
                            value={motive}
                            onChange={e => setMotive(e.target.value)}
                            placeholder="Productos Vencidos o rotos..."
                            rows={8}
                            className="w-full rounded-[5px] border border-slate-200 px-3 py-2 text-[13px] text-slate-700 outline-none resize-none focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
                        />
                    </div>
                </div>

                {/* Error message display */}
                {error && (
                    <p className="mt-3 text-[13px] text-red-500">{error}</p>
                )}

                {/* Action buttons: Cancel (Atras) and Save (Guardar) */}
                <div className="mt-auto flex justify-end gap-3 pt-4">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-[5px] border border-slate-300 px-6 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Atras
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-[5px] bg-[#2b6df5] px-6 py-2 text-[14px] font-bold text-white hover:bg-[#1a5ce0] transition-colors disabled:opacity-50"
                    >
                        {saving ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
}