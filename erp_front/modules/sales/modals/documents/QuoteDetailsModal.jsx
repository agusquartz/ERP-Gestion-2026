"use client";

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString("es-PY");
}

function XIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function QuoteDetailsModal({
  isOpen,
  onClose,
  quote,
  onCreateInvoice,
}) {
  if (!isOpen || !quote) return null;

  const details = quote.details ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[10px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#185BFF]">
              Presupuesto
            </p>

            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
              {quote.invoice_number ?? `P-${String(quote.id).padStart(3, "0")}`}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Visualización del presupuesto seleccionado
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-[8px] border border-slate-200 bg-[#F1F4F9] p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Fecha
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {quote.date ?? quote.createdAt ?? "-"}
              </p>
            </div>

            <div className="rounded-[8px] border border-slate-200 bg-[#F1F4F9] p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Cliente
              </p>
              <p className="mt-1 truncate text-sm font-bold text-slate-900">
                {quote.client}
              </p>
            </div>

            <div className="rounded-[8px] border border-slate-200 bg-[#F1F4F9] p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Estado
              </p>
              <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase text-amber-700">
                {quote.status ?? "Pendiente"}
              </span>
            </div>

            <div className="rounded-[8px] border border-slate-200 bg-[#F1F4F9] p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Total
              </p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">
                ${formatMoney(quote.total)}
              </p>
            </div>
          </div>

          {/* Details table */}
          <div className="mt-6 overflow-hidden rounded-[8px] border border-slate-200">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="bg-[#F1F4F9]">
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase text-slate-500">
                    Código
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase text-slate-500">
                    Producto
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase text-slate-500">
                    Cantidad
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase text-slate-500">
                    Unitario
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase text-slate-500">
                    IVA
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase text-slate-500">
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody>
                {details.map((detail, index) => {
                  const unitCost = detail.unitCost ?? detail.unit_cost ?? 0;

                  return (
                    <tr
                      key={`${detail.product?.id ?? index}-${index}`}
                      className="border-t border-slate-100"
                    >
                      <td className="px-3 py-3 text-sm font-bold text-[#185BFF]">
                        {detail.product?.code ?? "-"}
                      </td>

                      <td className="truncate px-3 py-3 text-sm font-medium text-slate-800">
                        {detail.product?.description ?? "-"}
                      </td>

                      <td className="px-3 py-3 text-right text-sm text-slate-700">
                        {detail.quantity}
                      </td>

                      <td className="px-3 py-3 text-right text-sm text-slate-700">
                        ${formatMoney(unitCost)}
                      </td>

                      <td className="px-3 py-3 text-right text-sm text-slate-700">
                        {formatMoney(detail.tax)}%
                      </td>

                      <td className="px-3 py-3 text-right text-sm font-bold text-slate-900">
                        ${formatMoney(detail.subtotal)}
                      </td>
                    </tr>
                  );
                })}

                {details.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-sm text-slate-400"
                    >
                      Este presupuesto no tiene detalles cargados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={onCreateInvoice}
            className="rounded-[8px] bg-[#185BFF] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f4be0] active:scale-95"
          >
            Crear Factura
          </button>
        </div>
      </div>
    </div>
  );
}