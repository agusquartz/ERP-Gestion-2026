"use client";

import { formatDate } from "./utils.js";

// "Pagos de la Factura" tab — shows payment orders and the account status widget.
// Layout: table on the left, Estado de Cuenta card on the right (image 1).
//
// `payments` is an array of PurchasePaymentOrderResponseDto.
// `invoice` is the full invoice detail (used for total/totalPaid in the status card).
export function PaymentsTab({ payments, invoice, loading, error }) {
    // --- Loading state: show centered spinner-like text ---
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
                Cargando pagos...
            </div>
        );
    }

    // --- Error state: display the error message prominently ---
    if (error) {
        return (
            <div className="flex items-center justify-center py-20 text-red-400 text-[14px]">
                {error}
            </div>
        );
    }

    // --- Financial calculations for the status card ---
    const total      = Number(invoice?.total      ?? 0);  // Total invoice amount
    const totalPaid  = Number(invoice?.totalPaid  ?? 0);  // Total amount already paid (from invoice summary)
    // Sum of "Pagado" payments from the payments array (today's payments that are confirmed)
    const paidToday  = payments
        .filter(p => p.status?.name === "Pagado")
        .reduce((acc, p) => acc + Number(p.totalToPay ?? 0), 0);
    const pending    = total - totalPaid;                 // Remaining balance

    return (
        <div className="flex gap-6">
            {/* ------------------------------------------------
                LEFT COLUMN: Payment Orders Table
                Fixed height with overflow, border, rounded corners
            ------------------------------------------------ */}
            <div className="h-[61vh] flex-1 overflow-x-auto rounded-[5px] border border-slate-200">
                <table className="w-full text-[14px] text-slate-700">
                    {/* Table header with styled columns */}
                    <thead>
                        <tr className="border-b border-slate-200 bg-background">
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Numero de Pago</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metodo de Pago</th>
                            <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.length === 0 ? (
                            // Empty state: no payments registered
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-[14px]">
                                    No hay pagos registrados.
                                </td>
                            </tr>
                        ) : payments.map((p, i) => (
                            // Each payment row: index, payment id, date, status, amount
                            <tr key={p.id} className="hover:bg-[#F2F3F7] transition-colors">
                                <td className="px-5 py-3.5 text-slate-400">{i + 1}</td>
                                <td className="px-5 py-3.5 font-medium">{p.id}</td>
                                {/* Display scheduled payment date if available, otherwise creation date */}
                                <td className="px-5 py-3.5 text-slate-600">{formatDate(p.scheduledPaymentDate ?? p.createdAt)}</td>
                                <td className="px-5 py-3.5 text-slate-600">{p.status?.name ?? "—"}</td>
                                <td className="px-5 py-3.5 text-right font-medium">
                                    $ {Number(p.totalToPay).toLocaleString("es-PY")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ------------------------------------------------
                RIGHT COLUMN: "Estado de Cuenta" summary card
                Fixed width, white background, rounded, with color-coded statuses
            ------------------------------------------------ */}
            <div className="w-[200px] shrink-0 rounded-[10px] border border-slate-200 bg-white p-4 flex flex-col gap-3 self-start">
                <p className="text-[13px] font-bold text-slate-700">Estado de Cuenta</p>

                {/* Total amount (blue square) */}
                <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-sm bg-[#2b6df5]" />
                    <div>
                        <p className="text-[11px] text-slate-400">Saldo Total</p>
                        <p className="text-[15px] font-bold text-slate-800">
                            $ {total.toLocaleString("es-PY")}
                        </p>
                    </div>
                </div>

                {/* Already paid until today (green square) */}
                <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-sm bg-emerald-500" />
                    <div>
                        <p className="text-[11px] text-slate-400">Pagado Hasta Hoy</p>
                        <p className="text-[15px] font-bold text-slate-800">
                            $ {totalPaid.toLocaleString("es-PY")}
                        </p>
                    </div>
                </div>

                {/* Separator line */}
                <div className="h-px bg-slate-100" />

                {/* Pending balance (red square) */}
                <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-sm bg-red-500" />
                    <div>
                        <p className="text-[11px] text-slate-400">Saldo Pendiente</p>
                        <p className="text-[15px] font-bold text-slate-800">
                            $ {pending.toLocaleString("es-PY")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}