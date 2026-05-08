"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPurchasePaymentOrder } from "@/lib/http/client/purchase-payment-order";

const DEFAULT_STATUS_ID = 3; // pending
const DEFAULT_REQUESTED_BY_EMPLOYEE_ID = 1;

const MOCK_SUPPLIER = {
  id: 1,
  name: "Distribuidora AV SA",
};

const MOCK_AVAILABLE_INVOICES = [
  {
    id: 1,
    invoiceNr: "FA-0012",
    createdAt: "2026-03-14",
    total: 16800,
    totalPaid: 0,
    status: "Pendiente",
  },
  {
    id: 2,
    invoiceNr: "FA-0114",
    createdAt: "2026-03-16",
    total: 21500,
    totalPaid: 0,
    status: "Pendiente",
  },
];

function formatMoney(value) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(dateString) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function PlusIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function InfoIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function TrashIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function SummaryIconBox() {
  return (
    <div className="h-10 w-10 rounded-[7px] bg-slate-400 shadow-md" />
  );
}

export default function NewPurchasePaymentOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supplier = {
    id: Number(searchParams.get("supplierId")) || MOCK_SUPPLIER.id,
    name: searchParams.get("supplierName") || MOCK_SUPPLIER.name,
  };

  const [selectedInvoices, setSelectedInvoices] = useState(MOCK_AVAILABLE_INVOICES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const totalAmount = useMemo(() => {
    return selectedInvoices.reduce((acc, invoice) => {
      const pendingAmount = Number(invoice.total) - Number(invoice.totalPaid || 0);
      return acc + pendingAmount;
    }, 0);
  }, [selectedInvoices]);

  const removeInvoice = (invoiceId) => {
    setSelectedInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
  };

  const handleAddInvoice = () => {
    alert("Aquí puedes abrir un modal para buscar facturas pendientes del proveedor.");
  };

  const handleCancel = () => {
    router.back();
  };

  const handleConfirm = async () => {
    if (selectedInvoices.length === 0) {
      setError("Debe agregar al menos una factura.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        supplierId: supplier.id,
        statusId: DEFAULT_STATUS_ID,
        requestedByEmployeeId: DEFAULT_REQUESTED_BY_EMPLOYEE_ID,
        scheduledPaymentDate: new Date().toISOString().slice(0, 10),
        observations: `Orden de pago para facturas pendientes de ${supplier.name}.`,
        details: selectedInvoices.map((invoice) => ({
          purchaseInvoiceId: invoice.id,
          amountToPay: String(Number(invoice.total) - Number(invoice.totalPaid || 0)),
          observations: `Pago de factura ${invoice.invoiceNr}`,
        })),
      };

      await createPurchasePaymentOrder(payload);

      router.push("/purchase-payment-orders");
    } catch (err) {
      setError(err.message || "No se pudo crear la orden de pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen flex-col bg-white px-6 py-7 text-slate-950">
      <div className="mb-8">
        <h1 className="text-[38px] font-extrabold leading-none tracking-tight text-[#121428]">
          Nueva Orden de Pago
        </h1>

        <div className="mt-9 flex items-center gap-1 text-[18px]">
          <span className="font-extrabold text-slate-900">Proveedor:</span>
          <span className="font-medium text-slate-600">{supplier.name}</span>
        </div>

        <div className="mt-2 h-px w-full bg-slate-400" />
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_328px]">
        <section className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-[39px] flex-1 items-center rounded-[5px] border border-[#8dadff] bg-[#eef4ff] px-6 text-[15px] font-bold text-slate-600">
              <InfoIcon className="mr-3 h-6 w-6 text-slate-600" />
              Solo se muestran facturas de {supplier.name}.
            </div>

            <button
              type="button"
              onClick={handleAddInvoice}
              className="inline-flex h-[37px] items-center gap-3 rounded-[5px] bg-[#5200ff] px-4 text-[12px] font-extrabold text-white shadow-sm transition hover:bg-[#4300d6] active:scale-[0.99]"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar factura
            </button>
          </div>

          <div className="flex h-[440px] flex-col overflow-hidden rounded-[5px] border border-slate-200 bg-white shadow-sm">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="h-[28px] bg-[#ededf1] text-[12px] font-extrabold text-black shadow-[0_2px_5px_rgba(0,0,0,0.25)]">
                    <th className="w-[52px] px-3 text-center">#</th>
                    <th className="px-3 text-left">Nro Factura</th>
                    <th className="px-3 text-left">Fecha</th>
                    <th className="px-3 text-left">Monto Total</th>
                    <th className="px-3 text-center">Estado</th>
                    <th className="w-[150px] px-3 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedInvoices.map((invoice, index) => {
                    const pendingAmount =
                      Number(invoice.total) - Number(invoice.totalPaid || 0);

                    return (
                      <tr
                        key={invoice.id}
                        className={`h-[33px] text-[12px] text-black ${
                          index % 2 === 1 ? "bg-[#f0f0f4]" : "bg-white"
                        }`}
                      >
                        <td className="px-3 text-center">{index + 1}</td>

                        <td className="px-3 font-medium">{invoice.invoiceNr}</td>

                        <td className="px-3">{formatDate(invoice.createdAt)}</td>

                        <td className="px-3">{formatMoney(pendingAmount)}</td>

                        <td className="px-3 text-center">
                          <span className="inline-flex items-center gap-2 rounded-[5px] border border-red-500 bg-red-50 px-3 py-0.5 text-[12px] font-bold text-red-900">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-900" />
                            {invoice.status || "Pendiente"}
                          </span>
                        </td>

                        <td className="px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeInvoice(invoice.id)}
                            className="inline-flex rounded-md p-1.5 text-black transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Quitar factura"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {selectedInvoices.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-sm font-medium text-slate-400"
                      >
                        No hay facturas agregadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-1 pl-2 text-[13px] font-bold text-slate-400">
            total facturas: {selectedInvoices.length}
          </p>

          {error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
        </section>

        <aside className="rounded-[5px] border border-slate-200 bg-white p-7 shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
          <h2 className="mb-6 text-[22px] font-extrabold text-neutral-800">
            Detalle de la Orden de Pago
          </h2>

          <div className="ml-11 space-y-10">
            <div className="flex items-center gap-4">
              <SummaryIconBox />

              <div>
                <p className="text-[15px] font-extrabold leading-tight text-neutral-500">
                  Saldo
                  <br />
                  Total
                </p>
                <p className="mt-1 text-[25px] font-extrabold leading-none text-neutral-800">
                  {formatMoney(totalAmount)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <SummaryIconBox />

              <div>
                <p className="text-[15px] font-extrabold leading-tight text-neutral-500">
                  Total
                  <br />
                  Facturas:
                </p>
                <p className="mt-2 text-[25px] font-extrabold leading-none text-neutral-800">
                  {selectedInvoices.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-14 h-px w-full bg-slate-200" />
        </aside>
      </div>

      <div className="mt-14 flex justify-end gap-8">
        <button
          type="button"
          onClick={handleCancel}
          className="h-[42px] w-[233px] rounded-[6px] border border-[#ff7d95] bg-white text-[18px] font-extrabold text-[#f60039] transition hover:bg-red-50 active:scale-[0.99]"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting || selectedInvoices.length === 0}
          className="h-[42px] w-[261px] rounded-[6px] bg-[#5200ff] text-[18px] font-extrabold text-white transition hover:bg-[#4300d6] disabled:cursor-not-allowed disabled:bg-slate-300 active:scale-[0.99]"
        >
          {isSubmitting ? "Confirmando..." : "Confirmar orden de pago"}
        </button>
      </div>
    </div>
  );
}