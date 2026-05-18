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
      className={`inline-flex min-w-[96px] items-center gap-2 rounded-[5px] border px-2.5 py-0.5 text-xs font-semibold ${border} ${bg} ${text}`}
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
          paidAmount: calculatePaidAmount(data),   // you can compute from details if not provided
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
      <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
        <div className="mb-4 rounded-[5px] border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Cargando orden de pago...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
        <div className="mb-4 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || "Orden de pago no encontrada"}
        </div>
        <button
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
  const paidAmount = order.status === "Pagado" ? totalAmount : (order.status === "Parcial" ? totalAmount * 0.5 : 0);
  const pendingAmount = totalAmount - paidAmount;

  // Print handler: opens a new window with a print-friendly layout
  const handlePrint = () => {
    if (!order) return;

    const totalInvoices = order.invoices?.length || 0;
    const totalAmount = order.totalToPay;
    const paidAmount = order.status === "Pagado" ? totalAmount : (order.status === "Parcial" ? totalAmount * 0.5 : 0);
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
                `).join('')}
                ${!order.invoices?.length ? `
                  <tr>
                    <td colspan="4" class="text-center">No hay facturas asociadas</td>
                  </tr>
                ` : ''}
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
  <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
    {/* Header with back and print buttons */}
      <div className="mb-5">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-medium text-secondary transition hover:text-foreground"
          >
            <ChevronLeftIcon />
            Volver
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-[5px] bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            <PrintIcon />
            Imprimir
          </button>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
          <h1 className="text-[28px] font-extrabold leading-none tracking-tight text-foreground md:text-[36px]">
            Orden Pago #{order.paymentNumber}
          </h1>
          <PaymentStatusBadge status={order.status} />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm md:grid-cols-2">
          <div>
            <span className="font-semibold text-secondary">Proveedor:</span>{" "}
            <span className="text-foreground">{order.supplier?.name || "Sin proveedor"}</span>
          </div>
          <div>
            <span className="font-semibold text-secondary">Fecha:</span>{" "}
            <span className="text-foreground">{formatDate(order.createdAt)}</span>
          </div>
        </div>
        <div className="mt-2 h-px w-full bg-foreground/80" />
      </div>

    {/* Two-column layout: Invoices Table (left) + Status Card (right) */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: Invoices Table - takes 2/3 on large screens */}
      <div className="lg:col-span-2">
        <div className="rounded-[5px] border border-border bg-surface shadow-panel">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background text-xs font-semibold text-muted-foreground">
                  <th className="w-[50px] border-b border-border px-3 py-2.5 text-center">#</th>
                  <th className="border-b border-border px-3 py-2.5 text-left">Factura</th>
                  <th className="border-b border-border px-3 py-2.5 text-left">Fecha</th>
                  <th className="border-b border-border px-3 py-2.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {order.invoices?.map((invoice, idx) => (
                  <tr key={idx} className="border-b border-border text-sm text-foreground">
                    <td className="px-3 py-2.5 text-center">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-medium">{invoice.number}</td>
                    <td className="px-3 py-2.5">{formatDate(invoice.date)}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(invoice.amount)}</td>
                  </tr>
                ))}
                {(!order.invoices || order.invoices.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      No hay facturas asociadas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-2 text-right text-sm font-medium text-secondary">
            Total de facturas: {totalInvoices}
          </div>
        </div>
      </div>

      {/* Right: Payment Status Card - takes 1/3 on large screens */}
      <div className="lg:col-span-1">
        <div className="rounded-[5px] border border-border bg-surface p-4 shadow-panel">
          <h3 className="mb-3 text-base font-bold text-foreground">Estado de Orden de Pago</h3>
          <div className="flex flex-col gap-4">
            <div className="rounded-[5px] bg-background p-3 text-center">
              <div className="text-xs font-semibold text-secondary">Total</div>
              <div className="text-xl font-bold text-foreground">{formatMoney(totalAmount)}</div>
            </div>
            <div className="rounded-[5px] bg-background p-3 text-center">
              <div className="text-xs font-semibold text-secondary">Pagado</div>
              <div className="text-xl font-bold text-success">{formatMoney(paidAmount)}</div>
            </div>
            <div className="rounded-[5px] bg-background p-3 text-center">
              <div className="text-xs font-semibold text-secondary">Saldo Pendiente</div>
              <div className="text-xl font-bold text-destructive">{formatMoney(pendingAmount)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}