"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPurchasePaymentOrderById } from "@/lib/http/client/purchase-payment-order";

/**
 * Format a number as currency (PYG - Paraguayan Guarani)
 * @param {number|string} value - The amount to format
 * @returns {string} Formatted currency string (e.g., "$ 25.200")
 */
function formatMoney(value) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

/**
 * Format a date string to "MMM DD, YYYY" (e.g., "Mar 3, 2026")
 * @param {string} dateString - ISO date string or YYYY-MM-DD
 * @returns {string} Formatted date or "-" if invalid
 */
function formatDate(dateString) {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

/**
 * Normalize status string from backend to consistent UI label
 * @param {string} statusName - Raw status from API
 * @returns {string} Normalized status: "Pagado", "Pendiente", "Parcial", or "Anulado"
 */
function normalizeStatus(statusName) {
  const value = String(statusName || "").toLowerCase();
  if (value === "ok" || value === "paid" || value === "pagado") return "Pagado";
  if (value === "pending" || value === "pendiente" || value === "created") return "Pendiente";
  if (value === "partial" || value === "parcial") return "Parcial";
  if (value === "cancelled" || value === "canceled" || value === "anulado") return "Anulado";
  return statusName || "Pendiente";
}

/**
 * Map normalized status to tab identifier
 * @param {string} statusName - Normalized status
 * @returns {string} Tab identifier: "Pagos", "Pendientes", "Parciales", "Anulados", or "Todos"
 */
function statusToTab(statusName) {
  const normalized = normalizeStatus(statusName);
  if (normalized === "Pagado") return "Pagos";
  if (normalized === "Pendiente") return "Pendientes";
  if (normalized === "Parcial") return "Parciales";
  if (normalized === "Anulado") return "Anulados";
  return "Todos";
}

/**
 * Get CSS classes for status badge based on status
 * @param {string} statusName - Status name
 * @returns {Object} Classes for border, background, text, and dot
 */
function statusBadgeClasses(statusName) {
  const normalized = normalizeStatus(statusName);

  switch (normalized) {
    case "Pagado":
      return {
        border: "border-success",
        bg: "bg-success/10",
        text: "text-success",
        dot: "bg-success",
      };

    case "Pendiente":
      return {
        border: "border-destructive",
        bg: "bg-destructive/10",
        text: "text-destructive",
        dot: "bg-destructive",
      };

    case "Parcial":
      return {
        border: "border-warning",
        bg: "bg-warning/10",
        text: "text-warning",
        dot: "bg-warning",
      };

    case "Anulado":
      return {
        border: "border-muted",
        bg: "bg-muted/10",
        text: "text-muted-foreground",
        dot: "bg-muted-foreground",
      };

    default:
      return {
        border: "border-muted",
        bg: "bg-muted/10",
        text: "text-muted-foreground",
        dot: "bg-muted-foreground",
      };
  }
}

/**
 * React component for displaying a payment status badge
 * @param {Object} props - Component props
 * @param {string} props.status - Status name
 * @returns {JSX.Element} Badge component
 */
function PaymentStatusBadge({ status }) {
  const { border, bg, text, dot } = statusBadgeClasses(status);

  return (
    <span
      className={`inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-bold ${border} ${bg} ${text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 9V3h12v6" />
      <rect x="6" y="15" width="12" height="6" rx="2" />
    </svg>
  );
}

export default function PurchasePaymentOrderDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Extract id from dynamic route – e.g. /purchases/purchase-payment-orders/34
  const id = params.id;

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function loadOrder() {
      try {
        setIsLoading(true);

        // Call your existing client function (GET /purchase-payment-orders/{id})
        const data = await getPurchasePaymentOrderById(id);

        // Transform the backend DTO into the structure our UI expects
        // Backend sends: { id, createdAt, scheduledPaymentDate, status: { id, name }, supplier: { id, name }, totalToPay, details: [...] }
        const mappedOrder = {
          id: data.id,
          paymentNumber: String(data.id).padStart(4, "0"),
          createdAt: data.createdAt,
          supplier: data.supplier,
          status: normalizeStatus(data.status?.name),
          totalToPay: Number(data.totalToPay),

          // Build invoices array from details
          invoices: (data.details || []).map((detail, idx) => ({
            number: detail.purchaseInvoice?.invoiceNr || `FAC-${idx + 1}`,
            date: detail.purchaseInvoice?.createdAt,
            amount: Number(detail.amountToPay),
          })),

          // Additional fields for the status summary block
          paidAmount: calculatePaidAmount(data),
        };

        setOrder(mappedOrder);
      } catch (err) {
        console.error("Failed to load payment order:", err);
        setError(err.message || "Error al cargar la orden de pago");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  // Helper: compute total paid from details (or from a separate field if backend sends it)
  function calculatePaidAmount(orderData) {
    // If the backend includes a separate paidAmount field, use that.
    // Otherwise, you can sum payments from details if available.
    // For now, we assume that if status is "Pagado", paid = totalToPay, else 0.
    // You can adjust this logic based on your actual data.
    const statusName = orderData.status?.name?.toLowerCase();

    if (statusName === "pagado" || statusName === "paid" || statusName === "ok") {
      return Number(orderData.totalToPay);
    }

    // For partial payments you might need to sum actual paid amounts from another endpoint.
    // For demonstration we return 0 for pending/partial (the UI will show 0 paid).
    return 0;
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
        <div className="rounded-[5px] border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Cargando orden de pago...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
        <div className="mb-4 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || "Orden de pago no encontrada"}
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-fit rounded-[5px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Volver
        </button>
      </div>
    );
  }

  // Compute summary numbers
  const totalInvoices = order.invoices?.length || 0;
  const totalAmount = order.totalToPay;

  // For a real implementation, you might have a `paidAmount` field from the backend.
  // Here we simulate based on status – replace with actual data when available.
  const paidAmount =
    order.status === "Pagado"
      ? totalAmount
      : order.status === "Parcial"
        ? totalAmount * 0.5
        : 0;

  const pendingAmount = totalAmount - paidAmount;

  // Print handler: opens a new window with a print-friendly layout
  const handlePrint = () => {
    if (!order) return;

    const totalInvoices = order.invoices?.length || 0;
    const totalAmount = order.totalToPay;
    const paidAmount =
      order.status === "Pagado"
        ? totalAmount
        : order.status === "Parcial"
          ? totalAmount * 0.5
          : 0;
    const pendingAmount = totalAmount - paidAmount;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to print the document.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orden Pago #${order.paymentNumber}</title>
          <meta charset="UTF-8" />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
              background: white;
              padding: 2rem;
              color: #111827;
            }
            .print-container {
              max-width: 1100px;
              margin: 0 auto;
            }
            .header {
              margin-bottom: 1.5rem;
              border-bottom: 2px solid #e0e3f0;
              padding-bottom: 1rem;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 800;
              margin-bottom: 0.5rem;
            }
            .status-badge {
              display: inline-block;
              padding: 0.25rem 0.75rem;
              border-radius: 5px;
              font-size: 0.75rem;
              font-weight: 600;
              border: 1px solid;
            }
            .status-Pagado { background: #16a34a10; border-color: #16a34a; color: #16a34a; }
            .status-Pendiente { background: #dc262610; border-color: #dc2626; color: #dc2626; }
            .status-Parcial { background: #f59e0b10; border-color: #f59e0b; color: #f59e0b; }
            .status-Anulado { background: #64748b10; border-color: #64748b; color: #64748b; }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 0.5rem;
              margin-top: 1rem;
              font-size: 0.875rem;
            }
            .info-label {
              font-weight: 600;
              color: #44536B;
            }
            .card-status {
              background: #f3f4f6;
              border-radius: 8px;
              padding: 1rem;
              margin: 1.5rem 0;
              display: flex;
              justify-content: space-around;
              text-align: center;
              flex-wrap: wrap;
              gap: 1rem;
            }
            .status-item {
              flex: 1;
              min-width: 120px;
            }
            .status-label {
              font-size: 0.75rem;
              font-weight: 600;
              color: #44536B;
              text-transform: uppercase;
            }
            .status-value {
              font-size: 1.5rem;
              font-weight: 700;
              margin-top: 0.25rem;
            }
            .total-value { color: #111827; }
            .paid-value { color: #16a34a; }
            .pending-value { color: #dc2626; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 1rem;
            }
            th, td {
              border-bottom: 1px solid #e0e3f0;
              padding: 0.75rem 0.5rem;
              text-align: left;
            }
            th {
              background: #f9fafb;
              font-size: 0.75rem;
              font-weight: 600;
              color: #64748b;
            }
            td {
              font-size: 0.875rem;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .footer {
              margin-top: 2rem;
              font-size: 0.75rem;
              color: #64748b;
              text-align: center;
              border-top: 1px solid #e0e3f0;
              padding-top: 1rem;
            }
            @media print {
              body {
                padding: 0.5rem;
              }
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>Orden Pago #${order.paymentNumber}</h1>
              <div>
                <span class="status-badge status-${order.status}">${order.status}</span>
              </div>
              <div class="info-grid">
                <div><span class="info-label">Proveedor:</span> ${order.supplier?.name || "Sin proveedor"}</div>
                <div><span class="info-label">Fecha:</span> ${formatDate(order.createdAt)}</div>
              </div>
            </div>

            <!-- Status Card (below header) -->
            <div class="card-status">
              <div class="status-item">
                <div class="status-label">Total</div>
                <div class="status-value total-value">${formatMoney(totalAmount)}</div>
              </div>
              <div class="status-item">
                <div class="status-label">Pagado</div>
                <div class="status-value paid-value">${formatMoney(paidAmount)}</div>
              </div>
              <div class="status-item">
                <div class="status-label">Saldo Pendiente</div>
                <div class="status-value pending-value">${formatMoney(pendingAmount)}</div>
              </div>
            </div>

            <!-- Invoices Table -->
            <h3 style="margin: 1rem 0 0.5rem 0; font-size: 1rem;">DETALLES DE LAS FACTURAS</h3>
            <table>
              <thead>
                <tr>
                  <th class="text-center" style="width: 50px;">#</th>
                  <th>Factura</th>
                  <th>Fecha</th>
                  <th class="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${order.invoices?.map((inv, idx) => `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td>${inv.number}</td>
                    <td>${formatDate(inv.date)}</td>
                    <td class="text-right">${formatMoney(inv.amount)}</td>
                  </tr>
                `).join("")}
                ${!order.invoices?.length ? `
                  <tr>
                    <td colspan="4" class="text-center">No hay facturas asociadas</td>
                  </tr>
                ` : ""}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-right" style="font-weight: 600;">Total de facturas:</td>
                  <td class="text-right" style="font-weight: 600;">${totalInvoices}</td>
                </tr>
              </tfoot>
            </table>
            <div class="footer">
              Documento generado el ${new Date().toLocaleDateString()}
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
      {/* Header */}
      <div className="mb-5 shrink-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-medium text-secondary transition hover:text-foreground"
          >
            <ChevronLeftIcon />
            Volver
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover active:scale-95"
          >
            <PrintIcon />
            Imprimir
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
            Orden Pago #{order.paymentNumber}
          </h1>

          <PaymentStatusBadge status={order.status} />
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Consultá las facturas asociadas y el estado de la orden de pago.
        </p>

        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <div>
            <span className="font-semibold text-secondary">Proveedor:</span>{" "}
            <span className="text-foreground">
              {order.supplier?.name || "Sin proveedor"}
            </span>
          </div>

          <div>
            <span className="font-semibold text-secondary">Fecha:</span>{" "}
            <span className="text-foreground">{formatDate(order.createdAt)}</span>
          </div>
        </div>

        <div className="mt-2 h-px w-full bg-border" />
      </div>

      {/* Content */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_328px]">
        {/* Left: Invoices Table */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[680px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[70px]" />
                  <col />
                  <col className="w-[170px]" />
                  <col className="w-[180px]" />
                </colgroup>

                <thead>
                  <tr className="bg-background">
                    <th className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      #
                    </th>

                    <th className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Factura
                    </th>

                    <th className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Fecha
                    </th>

                    <th className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Monto
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {order.invoices?.map((invoice, idx) => (
                    <tr
                      key={idx}
                      className="group border-b border-gray-100 transition-colors hover:bg-[#f0f7ff]"
                    >
                      <td className="px-4 py-3.5 text-center text-sm text-foreground">
                        {idx + 1}
                      </td>

                      <td className="px-4 py-3.5 text-sm font-bold text-[#2b6df5]">
                        {invoice.number}
                      </td>

                      <td className="px-4 py-3.5 text-sm text-foreground">
                        {formatDate(invoice.date)}
                      </td>

                      <td className="px-4 py-3.5 text-right text-sm font-bold text-foreground">
                        {formatMoney(invoice.amount)}
                      </td>
                    </tr>
                  ))}

                  {(!order.invoices || order.invoices.length === 0) && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-9 text-center text-sm text-muted-foreground"
                      >
                        No hay facturas asociadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span>Total de facturas: {totalInvoices}</span>
            </div>
          </div>
        </div>

        {/* Right: Payment Status Card */}
        <aside className="min-h-0 overflow-auto rounded-[5px] border border-border bg-surface p-4 shadow-panel">
          <h3 className="mb-3 text-base font-bold text-foreground">
            Estado de Orden de Pago
          </h3>

          <div className="flex flex-col gap-4">
            <div className="rounded-[5px] bg-background p-3 text-center">
              <div className="text-xs font-semibold text-secondary">Total</div>
              <div className="text-xl font-bold text-foreground">
                {formatMoney(totalAmount)}
              </div>
            </div>

            <div className="rounded-[5px] bg-background p-3 text-center">
              <div className="text-xs font-semibold text-secondary">Pagado</div>
              <div className="text-xl font-bold text-success">
                {formatMoney(paidAmount)}
              </div>
            </div>

            <div className="rounded-[5px] bg-background p-3 text-center">
              <div className="text-xs font-semibold text-secondary">
                Saldo Pendiente
              </div>
              <div className="text-xl font-bold text-destructive">
                {formatMoney(pendingAmount)}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}