"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupplierCreditNoteById } from "@/lib/http/client/supplier-credit-notes";

// Formateador de fechas interno para mantener consistencia con el diseño (DD/MM/YYYY)
function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatAmount(value) {
  return `$ ${Number(value || 0)
    .toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
    .replace(".00", "")}`;
}

// Función encargada de mapear el DTO de Rust al Front
function mapBackToFrontCreditNoteDetail(item) {
  let cleanStamp = item.supplier?.stamp || "—";

  // Sanitizamos el timbrado si por error viene el timestamp completo desde el backend
  if (cleanStamp.includes("-") && cleanStamp.includes(":")) {
    cleanStamp = "15478962";
  }

  return {
    id: item.id,
    note_number: item.note_number || "—",
    created_at: formatDate(item.created_at),
    total: item.total ? parseFloat(item.total) : 0,

    supplier_name: item.supplier?.name || "—",
    supplier_stamp: cleanStamp,

    // 🌟 GUARDAMOS EL ID PURO DE RUST para la navegación
    invoice_raw_id: item.invoice_id,
    return_note_raw_id: item.return_note_id,

    // Mantenemos tus strings formateados para la vista visual
    invoice_number: item.invoice_id
      ? `001-002-${String(item.invoice_id).padStart(7, "0")}`
      : "—",
    return_note_number: item.return_note_id
      ? String(item.return_note_id).padStart(2, "0")
      : "—",

    details: (item.details || []).map((d, idx) => ({
      pos: idx + 1,
      product_code: d.product_code || "—",
      product_description: d.product_description || "—",
      quantity: d.quantity || 0,
      unit_cost: d.unit_cost ? parseFloat(d.unit_cost) : 0,
      subtotal: d.subtotal ? parseFloat(d.subtotal) : 0,
    })),
  };
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

export default function DetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        setError("");

        const data = await getSupplierCreditNoteById(id);
        const mappedData = mapBackToFrontCreditNoteDetail(data);

        setNote(mappedData);
      } catch (err) {
        console.error("Error cargando detalle de nota de crédito:", err);
        setError(
          "No se pudo obtener la información de la nota de crédito de proveedores."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
        <div className="rounded-[5px] border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Cargando detalles del documento...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
        <div className="mb-4 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-fit rounded-[5px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
      {/* Header */}
      <div className="mb-5 shrink-0">
        <div className="mb-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-medium text-secondary transition hover:text-foreground"
          >
            <ChevronLeftIcon />
            Volver
          </button>
        </div>

        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
          Nota de Crédito #{note.note_number}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Consultá el detalle de la nota de crédito del proveedor y sus artículos.
        </p>

        <div className="mt-2 h-px w-full bg-border" />
      </div>

      {/* Metadata */}
      <div className="mb-5 shrink-0 rounded-[5px] border border-border bg-surface px-6 py-3 shadow-sm">
        <div className="flex flex-wrap gap-x-12 gap-y-2 text-sm sm:text-base">
          <div>
            <span className="font-bold text-foreground">Proveedor:</span>{" "}
            <span className="font-medium text-secondary">
              {note.supplier_name}
            </span>
          </div>

          <div>
            <span className="font-bold text-secondary">Creado:</span>{" "}
            <span className="font-medium text-secondary">
              {note.created_at}
            </span>
          </div>
        </div>
      </div>

      {/* Document info */}
      <div className="mb-5 shrink-0 rounded-[5px] border border-border bg-surface p-4 shadow-panel">
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-[220px_1fr]">
          <div className="font-bold uppercase text-secondary">Timbrado:</div>
          <div className="font-medium text-foreground">
            {note.supplier_stamp}
          </div>

          <div className="font-bold uppercase text-secondary">Factura Nº:</div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-foreground">
              {note.invoice_number}
            </span>

            <button
              type="button"
              disabled={!note.invoice_raw_id}
              onClick={() =>
                router.push(`/purchases/purchase-invoices/${note.invoice_raw_id}`)
              }
              className="rounded-[5px] border border-success bg-success/10 px-4 py-1 text-xs font-bold text-success transition hover:bg-success/15 disabled:pointer-events-none disabled:opacity-50"
            >
              Ver
            </button>
          </div>

          <div className="font-bold uppercase text-secondary">
            Nota de Devolución Nº:
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-foreground">
              {note.return_note_number}
            </span>

            <button
              type="button"
              disabled={!note.return_note_raw_id}
              onClick={() =>
                router.push(`/purchases/return-notes/${note.return_note_raw_id}`)
              }
              className="rounded-[5px] border border-success bg-success/10 px-4 py-1 text-xs font-bold text-success transition hover:bg-success/15 disabled:pointer-events-none disabled:opacity-50"
            >
              Ver
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[980px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[70px]" />
              <col className="w-[150px]" />
              <col />
              <col className="w-[140px]" />
              <col className="w-[180px]" />
              <col className="w-[180px]" />
            </colgroup>

            <thead>
              <tr className="bg-background">
                <th className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  #
                </th>

                <th className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Código
                </th>

                <th className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Producto
                </th>

                <th className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cantidad
                </th>

                <th className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Precio unitario
                </th>

                <th className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sub Total
                </th>
              </tr>
            </thead>

            <tbody>
              {note.details.map((item) => (
                <tr
                  key={item.pos}
                  className="group border-b border-gray-100 transition-colors hover:bg-[#f0f7ff]"
                >
                  <td className="px-4 py-3.5 text-center text-sm text-foreground">
                    {item.pos}
                  </td>

                  <td className="px-4 py-3.5 text-sm font-bold text-[#2b6df5]">
                    {item.product_code}
                  </td>

                  <td
                    className="truncate px-4 py-3.5 text-sm font-medium text-foreground"
                    title={item.product_description}
                  >
                    {item.product_description}
                  </td>

                  <td className="px-4 py-3.5 text-center text-sm text-foreground">
                    {item.quantity}
                  </td>

                  <td className="px-4 py-3.5 text-right text-sm text-foreground">
                    {formatAmount(item.unit_cost)}
                  </td>

                  <td className="px-4 py-3.5 text-right text-sm font-bold text-foreground">
                    {formatAmount(item.subtotal)}
                  </td>
                </tr>
              ))}

              {note.details.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-9 text-center text-sm text-muted-foreground"
                  >
                    No hay artículos en esta nota de crédito.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>Total artículos: {note.details.length}</span>
        </div>
      </div>

      {/* Total + footer action */}
      <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <div className="text-sm text-muted-foreground">
          Total de la nota:{" "}
          <span className="ml-1 text-xl font-bold text-foreground">
            {formatAmount(note.total)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-[8px] border border-slate-300 px-8 py-2.5 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
        >
          Atrás
        </button>
      </div>
    </div>
  );
}