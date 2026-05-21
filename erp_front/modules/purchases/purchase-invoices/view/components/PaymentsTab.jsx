"use client";

import { formatDate } from "./utils.js";

export function PaymentsTab({ payments, invoice, loading, error }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
                Cargando pagos...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20 text-red-400 text-[14px]">
                {error}
            </div>
        );
    }

    const total     = Number(invoice?.total     ?? 0);
    const totalPaid = Number(invoice?.totalPaid ?? 0);
    const pending   = total - totalPaid;

    return (
        <div className="flex gap-6">
            {/* LEFT: Payment Orders Table */}
            <div className="h-[61vh] flex-1 overflow-x-auto rounded-[5px] border border-slate-200">
                <table className="w-full text-[14px] text-slate-700">
                    <thead>
                        <tr className="border-b border-slate-200 bg-background">
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Numero de Pago</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                            <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-[14px]">
                                    No hay pagos registrados.
                                </td>
                            </tr>
                        ) : payments.map((p, i) => (
                            <tr key={p.id} className="hover:bg-[#F2F3F7] transition-colors">
                                <td className="px-5 py-3.5 text-slate-400">{i + 1}</td>
                                <td className="px-5 py-3.5 font-medium">{p.id}</td>
                                <td className="px-5 py-3.5 text-slate-600">{formatDate(p.scheduledPaymentDate ?? p.createdAt)}</td>
                                <td className="px-5 py-3.5 text-right font-medium">
                                    $ {Number(p.totalToPay).toLocaleString("es-PY")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* RIGHT: "Estado de Cuenta" card — más ancho ahora que la tabla tiene menos columnas */}
            <div className="w-[300px] shrink-0 rounded-[5px] border border-slate-200 border-l-[4px] border-l-[#2563eb] bg-white p-5 flex flex-col gap-4 self-start">
                <p className="text-[17px] font-bold text-slate-700">Estado de Cuenta</p>

                <div className="flex items-center gap-3">
                    <span className="h-10 w-10 rounded-[5px] bg-[#185BFF] border border-[#E5E7EB] shrink-0 shadow-panel" />
                    <div>
                        <p className="text-[13px] font-bold text-[#6C6C6C]">Saldo Total</p>
                        <p className="text-[20px] font-bold text-[#3B3B3B]">
                            $ {total.toLocaleString("es-PY")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="h-10 w-10 rounded-[5px] bg-[#5DFC28] border border-[#E5E7EB] shrink-0 shadow-panel" />
                    <div>
                        <p className="text-[13px] font-bold text-[#6C6C6C]">Pagado Hasta Hoy</p>
                        <p className="text-[20px] font-bold text-[#3B3B3B]">
                            $ {totalPaid.toLocaleString("es-PY")}
                        </p>
                    </div>
                </div>

                <div className="h-0.5 bg-[#2563eb]" />

                <div className="flex items-center gap-3">
                    <span className="h-10 w-10 rounded-sm bg-[#FB3639] border border-[#E5E7EB] shrink-0 shadow-panel" />
                    <div>
                        <p className="text-[13px] font-bold text-[#6C6C6C]">Saldo Pendiente</p>
                        <p className="text-[20px] font-bold text-[#3B3B3B]">
                            $ {pending.toLocaleString("es-PY")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}   