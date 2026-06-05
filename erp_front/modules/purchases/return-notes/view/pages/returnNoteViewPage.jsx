"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReturnNoteById } from "@/lib/http/client/return-notes";
import { getPurchaseInvoiceById } from "@/lib/http/client/purchase-invoices";
import {
  createSupplierCreditNote,
  getSupplierCreditNoteById,
} from "@/lib/http/client/supplier-credit-notes";
/**
 * Gets today's date in YYYY-MM-DD format for date inputs.
 *
 * @returns {string} Current date formatted for HTML date inputs.
 */
function getTodayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Converts a value into a safe number.
 *
 * @param {number|string|null|undefined} value - Raw value.
 * @returns {number} Safe numeric value.
 */
function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

/**
 * Rounds a number to two decimal places.
 *
 * @param {number} value - Raw number.
 * @returns {number} Rounded number.
 */
function roundDecimal(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Converts a number into a string accepted by Rust Decimal.
 *
 * @param {number|string} value - Raw amount.
 * @returns {string} Decimal-safe string.
 */
function toDecimalString(value) {
  return String(roundDecimal(value));
}

/**
 * Format a number as Paraguayan Guarani currency.
 *
 * @param {number|string} value - Amount to format.
 * @returns {string} Formatted currency.
 */
function formatMoney(value) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

/**
 * Format a date string to DD/MM/YYYY.
 *
 * @param {string} dateString - ISO date string or YYYY-MM-DD.
 * @returns {string} Formatted date.
 */
function formatDate(dateString) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

/**
 * Normalizes backend status names to Spanish UI labels.
 *
 * @param {string} statusName - Raw backend status.
 * @returns {string} Spanish status label.
 */
function normalizeStatus(statusName) {
  const value = String(statusName || "").toLowerCase();

  if (value === "pending" || value === "pendiente" || value === "created") {
    return "Pendiente";
  }

  if (value === "approved" || value === "aprobado" || value === "ok") {
    return "Aprobado";
  }

  if (value === "cancelled" || value === "canceled" || value === "anulado") {
    return "Anulado";
  }

  return statusName || "Pendiente";
}

/**
 * Gets Tailwind classes for a return note status badge.
 *
 * @param {string} statusName - Status name.
 * @returns {{border: string, bg: string, text: string, dot: string}} Badge classes.
 */
function statusBadgeClasses(statusName) {
  const normalized = normalizeStatus(statusName);

  switch (normalized) {
    case "Aprobado":
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
 * Status badge used in the return note detail header.
 *
 * @param {{status: string}} props - Component props.
 * @returns {JSX.Element} Status badge.
 */
function ReturnNoteStatusBadge({ status }) {
  const { border, bg, text, dot } = statusBadgeClasses(status);

  return (
    <span
      className={`inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-bold ${border} ${bg} ${text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {normalizeStatus(status)}
    </span>
  );
}

function ChevronDownIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
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

/**
 * Maps backend return note response into a UI-friendly object.
 *
 * Supports both camelCase and snake_case responses from the backend.
 *
 * @param {Object} data - Backend return note DTO.
 * @returns {Object} UI return note.
 */
function mapReturnNote(data) {
  const purchaseInvoice = data.purchaseInvoice ?? data.purchase_invoice ?? null;
  const purchaseOrder = data.purchaseOrder ?? data.purchase_order ?? null;
  const supplier =
    data.supplier ??
    data.provider ??
    purchaseInvoice?.supplier ??
    purchaseInvoice?.provider ??
    { id: null, name: "Sin proveedor" };

  
  const creditNoteId =
    data.creditNoteId ??
    data.credit_note_id ??
    null;

  const status = data.status ?? null;

  const purchaseInvoiceId =
    data.purchaseInvoiceId ??
    data.purchase_invoice_id ??
    purchaseInvoice?.id ??
    null;

  const purchaseOrderId =
    data.purchaseOrderId ??
    data.purchase_order_id ??
    purchaseOrder?.id ??
    purchaseInvoice?.purchaseOrderId ??
    purchaseInvoice?.purchase_order_id ??
    purchaseInvoice?.purchaseOrder?.id ??
    purchaseInvoice?.purchase_order?.id ??
    null;

  const details = (data.details || []).map((detail) => {
    const product = detail.product ?? detail.item ?? null;

    const returnedQuantity = toNumber(
      detail.returnedQuantity ??
        detail.returned_quantity ??
        detail.quantity ??
        0
    );

    const amount = toNumber(
      detail.amount ??
        detail.subtotal ??
        detail.total ??
        detail.total_amount ??
        0
    );

    return {
      id: detail.id,
      productId:
        detail.productId ??
        detail.product_id ??
        product?.id ??
        null,
      code:
        product?.code ??
        detail.code ??
        "-",
      description:
        product?.description ??
        detail.description ??
        "-",

      // The current backend DTO does not expose invoiced quantity.
      // This fallback keeps the UI ready if the backend adds it later.
      invoicedQuantity:
        detail.invoicedQuantity ??
        detail.invoiced_quantity ??
        detail.invoiceQuantity ??
        detail.invoice_quantity ??
        detail.quantity ??
        "-",

      returnedQuantity,
      amount,
      unitCost: returnedQuantity > 0 ? amount / returnedQuantity : amount,
      raw: detail,
    };
  });

  return {
    id: data.id,
    returnNoteNumber: String(data.id).padStart(2, "0"),

    creditNoteId,

    purchaseInvoiceId,
    purchaseInvoiceNumber:
      purchaseInvoice?.invoiceNumber ??
      purchaseInvoice?.invoice_number ??
      purchaseInvoice?.invoiceNr ??
      purchaseInvoice?.invoice_nr ??
      String(purchaseInvoiceId || "-"),

    purchaseOrderId,

    motive:
      data.motive ??
      data.reason ??
      "-",

    createdAt:
      data.createdAt ??
      data.created_at,

    total: toNumber(
      data.total ??
        data.total_amount ??
        data.amount ??
        0
    ),

    supplier,

    status: normalizeStatus(
      status?.name ??
        status?.statusName ??
        status?.status_name ??
        data.statusName ??
        data.status_name
    ),

    details,
    raw: data,
  };
}

/**
 * Maps backend purchase invoice response into the small reference
 * needed by this return note page.
 *
 * @param {Object} data - Backend purchase invoice DTO.
 * @returns {{purchaseOrderId: number|null, purchaseInvoiceNumber: string}}
 */
function mapPurchaseInvoiceReference(data) {
  const purchaseOrder = data.purchaseOrder ?? data.purchase_order ?? null;

  const purchaseOrderId =
    data.purchaseOrderId ??
    data.purchase_order_id ??
    purchaseOrder?.id ??
    null;

  const purchaseInvoiceNumber =
    data.invoiceNumber ??
    data.invoice_number ??
    data.invoiceNr ??
    data.invoice_nr ??
    data.number ??
    String(data.id || "-");

  return {
    purchaseOrderId,
    purchaseInvoiceNumber,
  };
}

/**
 * Maps backend credit note response into a UI-friendly object.
 *
 * @param {Object} data - Backend credit note DTO.
 * @returns {Object} UI credit note.
 */
function mapSupplierCreditNote(data) {
  return {
    id: data.id,
    number:
      data.noteNumber ||
      data.note_number ||
      data.creditNoteNumber ||
      data.credit_note_number ||
      String(data.id).padStart(4, "0"),
    createdAt: data.createdAt || data.created_at,
    total: toNumber(data.total),
    returnNoteId:
      data.returnNoteId ??
      data.return_note_id ??
      data.returnNote?.id ??
      data.return_note?.id,
    details: data.details || [],
    raw: data,
  };
}

/**
 * Builds a quick credit note payload by distributing the total amount
 * proportionally across the returned items.
 *
 * @param {Object} returnNote - UI return note.
 * @param {Object} form - Quick form data.
 * @returns {Object} Payload for POST /credit-notes.
 */
function buildQuickCreditNotePayload(returnNote, form) {
  const totalToCredit = roundDecimal(form.totalToCredit);
  const sourceLines = returnNote.details.filter(
    (line) => line.productId && line.returnedQuantity > 0
  );

  const sourceTotal = sourceLines.reduce(
    (sum, line) => sum + toNumber(line.amount),
    0
  );

  let remainingAmount = totalToCredit;

  const details = sourceLines.map((line, index) => {
    const isLastLine = index === sourceLines.length - 1;

    const weight =
      sourceTotal > 0 ? toNumber(line.amount) / sourceTotal : 1 / sourceLines.length;

    const allocatedAmount = isLastLine
      ? remainingAmount
      : roundDecimal(totalToCredit * weight);

    remainingAmount = roundDecimal(remainingAmount - allocatedAmount);

    const unitCost =
      line.returnedQuantity > 0 ? allocatedAmount / line.returnedQuantity : 0;

    return {
      product_id: line.productId,
      quantity: line.returnedQuantity,
      unit_cost: toDecimalString(unitCost),
      subtotal: toDecimalString(allocatedAmount),
    };
  });

  return {
    note_number: form.creditNoteNumber.trim(),
    return_note_id: Number(returnNote.id),
    created_at: form.createdAt,
    total: toDecimalString(totalToCredit),
    details,
  };
}

/**
 * Builds a detailed credit note payload using user-entered line amounts.
 *
 * @param {Object} returnNote - UI return note.
 * @param {Object} form - Detailed form data.
 * @param {Array} lines - Editable line data.
 * @returns {Object} Payload for POST /credit-notes.
 */
function buildDetailedCreditNotePayload(returnNote, form, lines) {
  const details = lines
    .filter(
      (line) =>
        line.productId &&
        toNumber(line.quantity) > 0 &&
        toNumber(line.amount) > 0
    )
    .map((line) => {
      const quantity = toNumber(line.quantity);
      const amount = roundDecimal(line.amount);
      const unitCost = quantity > 0 ? amount / quantity : 0;

      return {
        product_id: line.productId,
        quantity,
        unit_cost: toDecimalString(unitCost),
        subtotal: toDecimalString(amount),
      };
    });

  const totalToCredit = details.reduce(
    (sum, detail) => sum + toNumber(detail.subtotal),
    0
  );

  return {
    note_number: form.creditNoteNumber.trim(),
    return_note_id: Number(returnNote.id),
    created_at: form.createdAt,
    total: toDecimalString(totalToCredit),
    details,
  };
}

function ViewButton({ children = "Ver", disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-w-[88px] rounded-[5px] border border-success bg-success/10 px-4 py-2 text-sm font-bold text-success transition hover:bg-success/15 disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted/10 disabled:text-muted-foreground"
    >
      {children}
    </button>
  );
}

function ModalShell({ title, maxWidthClass = "max-w-[760px]", children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`w-full ${maxWidthClass} rounded-[5px] border border-border bg-surface p-6 shadow-panel md:p-10`}
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <h2 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[5px] px-3 py-1 text-sm font-bold text-secondary transition hover:bg-background hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function QuickCreditNoteModal({
  returnNote,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    creditNoteNumber: "",
    createdAt: getTodayInputDate(),
    totalToCredit: String(returnNote.total || ""),
  });

  const totalToCredit = toNumber(form.totalToCredit);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.creditNoteNumber.trim()) return;
    if (!form.createdAt) return;
    if (totalToCredit <= 0) return;
    if (!returnNote.details.length) return;

    const payload = buildQuickCreditNotePayload(returnNote, form);
    await onSubmit(payload);
  };

  return (
    <ModalShell title="Ingresar Nota de Crédito" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-[540px] space-y-6">
          <div className="grid grid-cols-[190px_1fr] items-center gap-x-8 gap-y-5 text-base">
            <span className="font-bold text-secondary">Orden De Compra N°:</span>
            <span className="text-right font-medium text-foreground">
              {returnNote.purchaseOrderId || "-"}
            </span>

            <span className="font-bold text-secondary">Factura N°:</span>
            <span className="text-right font-medium text-foreground">
              {returnNote.purchaseInvoiceNumber}
            </span>

            <span className="font-bold text-secondary">Proveedor:</span>
            <span className="text-right font-medium text-foreground">
              {returnNote.supplier?.name || "Sin proveedor"}
            </span>

            <span className="font-bold text-secondary">Total Devolución:</span>
            <span className="text-right font-medium text-foreground">
              {formatMoney(returnNote.total)}
            </span>

            <label className="font-bold text-secondary" htmlFor="quickCreditNoteNumber">
              Nota N°:
            </label>
            <input
              id="quickCreditNoteNumber"
              value={form.creditNoteNumber}
              onChange={(event) => handleChange("creditNoteNumber", event.target.value)}
              className="h-11 rounded-[5px] border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />

            <label className="font-bold text-secondary" htmlFor="quickCreatedAt">
              Fecha:
            </label>
            <input
              id="quickCreatedAt"
              type="date"
              value={form.createdAt}
              onChange={(event) => handleChange("createdAt", event.target.value)}
              className="h-11 rounded-[5px] border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />

            <label className="font-bold text-secondary" htmlFor="quickTotalToCredit">
              Total A Acreditar:
            </label>
            <input
              id="quickTotalToCredit"
              type="number"
              min="0"
              step="0.01"
              value={form.totalToCredit}
              onChange={(event) => handleChange("totalToCredit", event.target.value)}
              className="h-11 rounded-[5px] border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="rounded-[5px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Esta carga distribuye el total proporcionalmente entre los ítems devueltos.
          </div>

          {submitError && (
            <div className="rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-[5px] border border-border bg-surface px-4 text-base font-extrabold text-foreground transition hover:bg-background"
          >
            Atrás
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-[5px] bg-primary px-4 text-base font-extrabold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : "Agregar Nota"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function DetailedCreditNoteModal({
  returnNote,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    creditNoteNumber: "",
    createdAt: getTodayInputDate(),
  });

  const [lines, setLines] = useState(() =>
    returnNote.details.map((line) => ({
      detailId: line.id,
      productId: line.productId,
      code: line.code,
      description: line.description,
      unitCost: line.unitCost,
      returnedQuantity: line.returnedQuantity,
      amountReturned: line.amount,
      quantity: String(line.returnedQuantity || ""),
      amount: String(line.amount || ""),
    }))
  );

  const totalToCredit = useMemo(() => {
    return lines.reduce((sum, line) => sum + toNumber(line.amount), 0);
  }, [lines]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLineChange = (detailId, field, value) => {
    setLines((prev) =>
      prev.map((line) =>
        line.detailId === detailId
          ? {
              ...line,
              [field]: value,
            }
          : line
      )
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.creditNoteNumber.trim()) return;
    if (!form.createdAt) return;
    if (totalToCredit <= 0) return;

    const payload = buildDetailedCreditNotePayload(returnNote, form, lines);
    await onSubmit(payload);
  };

  return (
    <ModalShell
      title="Ingresar Nota de Crédito"
      maxWidthClass="max-w-[1360px]"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-x-20 gap-y-6 md:grid-cols-2">
          <div className="grid grid-cols-[190px_1fr] items-center gap-x-8 gap-y-5">
            <label
              className="font-bold text-secondary"
              htmlFor="detailedCreditNoteNumber"
            >
              Nota de crédito N°:
            </label>
            <input
              id="detailedCreditNoteNumber"
              value={form.creditNoteNumber}
              onChange={(event) =>
                handleFormChange("creditNoteNumber", event.target.value)
              }
              className="h-11 rounded-[5px] border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />

            <span className="font-bold text-secondary">Orden De Compra N°:</span>
            <span className="text-right font-medium text-foreground">
              {returnNote.purchaseOrderId || "-"}
            </span>

            <span className="font-bold text-secondary">Factura N°:</span>
            <span className="text-right font-medium text-foreground">
              {returnNote.purchaseInvoiceNumber}
            </span>

            <label className="font-bold text-secondary" htmlFor="detailedCreatedAt">
              Fecha:
            </label>
            <input
              id="detailedCreatedAt"
              type="date"
              value={form.createdAt}
              onChange={(event) => handleFormChange("createdAt", event.target.value)}
              className="h-11 rounded-[5px] border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="grid grid-cols-[160px_1fr] items-center gap-x-8 gap-y-5">
            <span className="font-bold text-secondary">Proveedor:</span>
            <span className="text-right font-medium text-foreground">
              {returnNote.supplier?.name || "Sin proveedor"}
            </span>

            <span className="font-bold text-secondary">Timbrado:</span>
            <span className="text-right font-medium text-foreground">-</span>

            <span className="font-bold text-secondary">Total Devolución:</span>
            <span className="text-right font-medium text-foreground">
              {formatMoney(returnNote.total)}
            </span>

            <span className="font-bold text-secondary">Total A Acreditar:</span>
            <span className="text-right font-medium text-foreground">
              {formatMoney(totalToCredit)}
            </span>
          </div>
        </div>

        <h3 className="mb-2 mt-8 text-lg font-extrabold uppercase text-secondary">
          Items de la factura
        </h3>

        {/* CAMBIO: tabla del modal detallado con estilo tipo DocumentsTable */}
        <div className="flex min-h-[320px] flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[1100px] table-fixed border-collapse">
              <thead>
                <tr className="bg-background">
                  <th className="sticky top-0 w-[60px] border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    #
                  </th>

                  <th className="sticky top-0 w-[180px] border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Código
                  </th>

                  <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Producto
                  </th>

                  <th className="sticky top-0 w-[160px] border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Precio Unitario
                  </th>

                  <th className="sticky top-0 w-[160px] border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cant. Devuelta
                  </th>

                  <th className="sticky top-0 w-[170px] border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Monto Devuelto
                  </th>

                  <th className="sticky top-0 w-[180px] border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cant. A Acreditar
                  </th>

                  <th className="sticky top-0 w-[190px] border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Monto A Acreditar
                  </th>
                </tr>
              </thead>

              <tbody>
                {lines.map((line, index) => (
                  <tr
                    key={line.detailId}
                    className="group border-b border-gray-100 text-sm text-foreground transition-colors hover:bg-[#f0f7ff]"
                  >
                    <td className="px-4 py-3.5 text-center">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-[#2b6df5]">
                      {line.code}
                    </td>

                    <td
                      className="truncate px-4 py-3.5 font-medium"
                      title={line.description}
                    >
                      {line.description}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {formatMoney(line.unitCost)}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {line.returnedQuantity}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold">
                      {formatMoney(line.amountReturned)}
                    </td>

                    <td className="px-4 py-3.5">
                      <input
                        type="number"
                        min="0"
                        max={line.returnedQuantity}
                        value={line.quantity}
                        onChange={(event) =>
                          handleLineChange(line.detailId, "quantity", event.target.value)
                        }
                        className="h-10 w-full rounded-[5px] border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.amount}
                        onChange={(event) =>
                          handleLineChange(line.detailId, "amount", event.target.value)
                        }
                        className="h-10 w-full rounded-[5px] border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </td>
                  </tr>
                ))}

                {lines.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-9 text-center text-sm text-muted-foreground"
                    >
                      No hay ítems disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>Mostrando {lines.length} resultados</span>
          </div>
        </div>

        {submitError && (
          <div className="mt-4 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 items-end gap-6 lg:grid-cols-[1fr_270px_270px]">
          <div className="space-y-3 text-lg">
            <div className="grid max-w-[560px] grid-cols-[280px_1fr]">
              <span className="font-extrabold text-secondary">
                Monto Total de la Devolución:
              </span>
              <span className="font-medium text-foreground">
                {formatMoney(returnNote.total)}
              </span>
            </div>

            <div className="grid max-w-[560px] grid-cols-[280px_1fr]">
              <span className="font-extrabold text-secondary">
                Monto Total a Acreditar:
              </span>
              <span className="font-medium text-foreground">
                {formatMoney(totalToCredit)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-[5px] border border-border bg-surface px-4 text-base font-extrabold text-foreground transition hover:bg-background"
          >
            Atrás
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-[5px] bg-primary px-4 text-base font-extrabold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : "Agregar Nota"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default function ReturnNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [returnNote, setReturnNote] = useState(null);
  const [creditNotes, setCreditNotes] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const [showCreditNoteMenu, setShowCreditNoteMenu] = useState(false);
  const [creditNoteMode, setCreditNoteMode] = useState(null);

  const [isSubmittingCreditNote, setIsSubmittingCreditNote] = useState(false);
  const [creditNoteSubmitError, setCreditNoteSubmitError] = useState(null);

  const creditedTotal = useMemo(() => {
    return creditNotes.reduce((sum, note) => sum + toNumber(note.total), 0);
  }, [creditNotes]);

  const pendingCreditTotal = useMemo(() => {
    if (!returnNote) return 0;
    return Math.max(toNumber(returnNote.total) - creditedTotal, 0);
  }, [returnNote, creditedTotal]);

  useEffect(() => {
    if (!id) return;

    let ignore = false;

    async function loadReturnNote() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const data = await getReturnNoteById(id);
        let mappedReturnNote = mapReturnNote(data);

        if (
          !mappedReturnNote.purchaseOrderId &&
          mappedReturnNote.purchaseInvoiceId
        ) {
          try {
            const purchaseInvoiceData = await getPurchaseInvoiceById(
              mappedReturnNote.purchaseInvoiceId
            );
            const purchaseInvoiceReference =
              mapPurchaseInvoiceReference(purchaseInvoiceData);

            mappedReturnNote = {
              ...mappedReturnNote,
              purchaseInvoiceNumber:
                purchaseInvoiceReference.purchaseInvoiceNumber ||
                mappedReturnNote.purchaseInvoiceNumber,
              purchaseOrderId:
                purchaseInvoiceReference.purchaseOrderId ||
                mappedReturnNote.purchaseOrderId,
            };
          } catch (purchaseInvoiceError) {
            console.warn(
              "Purchase invoice reference could not be loaded:",
              purchaseInvoiceError
            );
          }
        }

        if (!ignore) {
          setReturnNote(mappedReturnNote);
        }

        try {
          if (!mappedReturnNote.creditNoteId) {
            if (!ignore) {
              setCreditNotes([]);
            }

            return;
          }

          const creditNoteData = await getSupplierCreditNoteById(
            mappedReturnNote.creditNoteId
          );

          const mappedCreditNote = mapSupplierCreditNote(creditNoteData);

          if (!ignore) {
            setCreditNotes([mappedCreditNote]);
          }
        } catch (creditNoteError) {
          console.warn("Credit note could not be loaded:", creditNoteError);

          if (!ignore) {
            setCreditNotes([]);
          }
        }
      } catch (error) {
        console.error("Failed to load return note:", error);

        if (!ignore) {
          setErrorMessage(error.message || "No se pudo cargar la nota de devolución.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadReturnNote();

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleOpenPurchaseInvoice = () => {
    if (!returnNote?.purchaseInvoiceId) return;
    router.push(`/purchases/purchase-invoices/${returnNote.purchaseInvoiceId}`);
  };

  const handleOpenPurchaseOrder = () => {
    if (!returnNote?.purchaseOrderId) return;
    router.push(`/purchases/purchase-orders/${returnNote.purchaseOrderId}`);
  };

  const handleOpenCreditNote = (creditNoteId) => {
    if (!creditNoteId) return;
    router.push(`/purchases/supplier-credit-notes/${creditNoteId}`);
  };

  const handleCreateCreditNote = async (payload) => {
    try {
      setIsSubmittingCreditNote(true);
      setCreditNoteSubmitError(null);

      console.log("Payload para crear nota de crédito:", payload);

      const createdCreditNote = await createSupplierCreditNote(payload);

      console.log("Respuesta al crear nota de crédito:", createdCreditNote);

      const mappedCreditNote = mapSupplierCreditNote(createdCreditNote);

      setCreditNotes([mappedCreditNote]);

      setReturnNote((prev) =>
        prev
          ? {
              ...prev,
              creditNoteId: mappedCreditNote.id,
            }
          : prev
      );
      setCreditNoteMode(null);
    } catch (error) {
      console.error("Error creando nota de crédito:", error);

      if (error.code === "INSUFFICIENT_STOCK") {
        setCreditNoteSubmitError(
          error.productId
            ? `No hay stock suficiente para el producto ID ${error.productId}.`
            : "No hay stock suficiente para completar la nota de crédito."
        );

        return;
      }

      if (error.code === "VALIDATION_ERROR") {
        setCreditNoteSubmitError(
          error.message || "Los datos enviados no son válidos."
        );

        return;
      }

      if (error.status === 409) {
        setCreditNoteSubmitError(
          error.message || "No se puede completar la operación por un conflicto de datos."
        );

        return;
      }

      setCreditNoteSubmitError(
        error.message || "No se pudo crear la nota de crédito."
      );
    } finally {
      setIsSubmittingCreditNote(false);
    }
  };

  const openCreditNoteModal = (mode) => {
    setCreditNoteSubmitError(null);
    setCreditNoteMode(mode);
    setShowCreditNoteMenu(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
        <div className="rounded-[5px] border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Cargando nota de devolución...
        </div>
      </div>
    );
  }

  if (errorMessage || !returnNote) {
    return (
      <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
        <div className="mb-4 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage || "Nota de devolución no encontrada."}
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

  return (
    <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
      <div className="mb-3 shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-medium text-secondary transition hover:text-foreground"
        >
          <ChevronLeftIcon />
          Volver
        </button>
      </div>

      <div className="mb-5 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
            Nota de Devolución N° {returnNote.returnNoteNumber}
          </h1>

          <ReturnNoteStatusBadge status={returnNote.status} />
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Consultá el detalle de la devolución, factura asociada e ítems devueltos.
        </p>

        <div className="mt-2 h-px w-full bg-border" />
      </div>

      <div className="mb-5 shrink-0 rounded-[5px] border border-border bg-surface px-6 py-3 shadow-sm">
        <div className="flex flex-wrap gap-x-12 gap-y-2 text-sm sm:text-base">
          <div>
            <span className="font-bold text-foreground">Proveedor:</span>{" "}
            <span className="font-medium text-secondary">
              {returnNote.supplier?.name || "Sin proveedor"}
            </span>
          </div>

          <div>
            <span className="font-bold text-secondary">Creado:</span>{" "}
            <span className="font-medium text-secondary">
              {formatDate(returnNote.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-5 shrink-0 grid max-w-[1020px] grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-[250px_1fr] sm:text-base">
        <div className="font-bold uppercase text-secondary">Motivo:</div>
        <div className="text-foreground">{returnNote.motive}</div>

        <div className="font-bold uppercase text-secondary">Factura N°:</div>
        <div className="flex items-center gap-4">
          <span className="min-w-[180px] font-bold text-foreground">
            {returnNote.purchaseInvoiceNumber}
          </span>
          <ViewButton
            disabled={!returnNote.purchaseInvoiceId}
            onClick={handleOpenPurchaseInvoice}
          >
            Ver
          </ViewButton>
        </div>

        <div className="font-bold uppercase text-secondary">
          Orden de Compra N°:
        </div>
        <div className="flex items-center gap-4">
          <span className="min-w-[180px] font-bold text-foreground">
            {returnNote.purchaseOrderId || "-"}
          </span>
          <ViewButton
            disabled={!returnNote.purchaseOrderId}
            onClick={handleOpenPurchaseOrder}
          >
            Ver
          </ViewButton>
        </div>

        <div className="font-bold uppercase text-secondary">
          Nota de Crédito N°:
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {creditNotes.length > 0 ? (
            creditNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => handleOpenCreditNote(note.id)}
                className="rounded-[5px] border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition hover:bg-primary/15"
                title={`Total: ${formatMoney(note.total)}`}
              >
                {note.number}
              </button>
            ))
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              Sin nota de crédito
            </span>
          )}

          <div className="relative">
            <button
              type="button"
              disabled={creditNotes.length > 0}
              onClick={() => setShowCreditNoteMenu((prev) => !prev)}
              className="flex h-11 items-center gap-3 rounded-[5px] bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creditNotes.length > 0 ? "Nota ya registrada" : "Agregar Nota de Crédito"}
              <ChevronDownIcon className="h-5 w-5" />
            </button>

            {showCreditNoteMenu && creditNotes.length === 0 && (
              <div className="absolute z-20 mt-2 w-[240px] rounded-[5px] border border-border bg-surface p-2 shadow-panel">
                <button
                  type="button"
                  onClick={() => openCreditNoteModal("quick")}
                  className="w-full rounded-[5px] px-3 py-2 text-left text-sm font-bold text-foreground transition hover:bg-background"
                >
                  Carga rápida
                </button>

                <button
                  type="button"
                  onClick={() => openCreditNoteModal("detailed")}
                  className="w-full rounded-[5px] px-3 py-2 text-left text-sm font-bold text-foreground transition hover:bg-background"
                >
                  Carga detallada
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-2 shrink-0 flex items-end justify-between gap-4">
        <h2 className="text-lg font-bold uppercase text-secondary">
          Items Devueltos
        </h2>

        <div className="pr-2 text-right text-sm">
          <div>
            <span className="font-bold text-secondary">Total devolución:</span>{" "}
            <span className="font-bold text-foreground">
              {formatMoney(returnNote.total)}
            </span>
          </div>
          <div>
            <span className="font-bold text-secondary">Total acreditado:</span>{" "}
            <span className="font-bold text-success">
              {formatMoney(creditedTotal)}
            </span>
          </div>
          <div>
            <span className="font-bold text-secondary">Saldo pendiente:</span>{" "}
            <span className="font-bold text-destructive">
              {formatMoney(pendingCreditTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* CAMBIO: tabla principal estilo DocumentsTable */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[950px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[70px]" />
              <col className="w-[180px]" />
              <col />
              <col className="w-[170px]" />
              <col className="w-[170px]" />
              <col className="w-[160px]" />
            </colgroup>

            <thead>
              <tr className="bg-background">
                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  #
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Código
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Producto
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cant. Facturada
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cant. Devuelta
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Monto
                </th>
              </tr>
            </thead>

            <tbody>
              {returnNote.details.map((detail, index) => (
                <tr
                  key={detail.id}
                  className="group border-b border-gray-100 transition-colors hover:bg-[#f0f7ff]"
                >
                  <td className="px-4 py-3.5 text-center text-sm text-foreground">
                    {index + 1}
                  </td>

                  <td className="px-4 py-3.5 text-sm font-bold text-[#2b6df5]">
                    {detail.code}
                  </td>

                  <td
                    className="truncate px-4 py-3.5 text-sm font-medium text-foreground"
                    title={detail.description}
                  >
                    {detail.description}
                  </td>

                  <td className="px-4 py-3.5 text-right text-sm text-foreground">
                    {detail.invoicedQuantity}
                  </td>

                  <td className="px-4 py-3.5 text-right text-sm text-foreground">
                    {detail.returnedQuantity}
                  </td>

                  <td className="px-4 py-3.5 text-right text-sm font-bold text-foreground">
                    {formatMoney(detail.amount)}
                  </td>
                </tr>
              ))}

              {returnNote.details.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-9 text-center text-sm text-muted-foreground"
                  >
                    No hay ítems devueltos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>Mostrando {returnNote.details.length} resultados</span>
        </div>
      </div>

      <div className="mt-4 shrink-0 flex justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-12 min-w-[280px] rounded-[5px] border border-border bg-surface px-4 text-base font-bold text-foreground transition hover:bg-background"
        >
          Atrás
        </button>
      </div>

      {creditNoteMode === "quick" && (
        <QuickCreditNoteModal
          returnNote={returnNote}
          isSubmitting={isSubmittingCreditNote}
          submitError={creditNoteSubmitError}
          onClose={() => setCreditNoteMode(null)}
          onSubmit={handleCreateCreditNote}
        />
      )}

      {creditNoteMode === "detailed" && (
        <DetailedCreditNoteModal
          returnNote={returnNote}
          isSubmitting={isSubmittingCreditNote}
          submitError={creditNoteSubmitError}
          onClose={() => setCreditNoteMode(null)}
          onSubmit={handleCreateCreditNote}
        />
      )}
    </div>
  );
}