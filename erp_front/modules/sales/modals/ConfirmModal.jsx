"use client";

import { Modal } from "@/shared/components/Modal";

const fmt = (n) => `$${Number(n).toFixed(0)}`;

export function ConfirmModal({
  open,
  onClose,
  type,
  client,
  subtotal,
  iva,
  total,
}) {
  const isFactura = type === "factura";
  const label = isFactura ? "Factura" : "Presupuesto";
  const emoji = isFactura ? "🧾" : "📋";

  return (
    <Modal open={open} onClose={onClose} width={400}>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-4xl">
          {emoji}
        </div>

        <h2 className="mb-2 text-xl font-bold text-foreground">
          {label} creado
        </h2>

        <p className="mb-6 text-sm leading-6 text-muted">
          {label} para{" "}
          <span className="font-semibold text-foreground">
            {client?.nombre} {client?.apellido}
          </span>{" "}
          por{" "}
          <span className="font-semibold text-foreground">
            {fmt(total)}
          </span>{" "}
          generado exitosamente.
        </p>

        <div className="mb-6 rounded-xl border border-border bg-surface p-4 text-left shadow-panel">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium text-foreground">{fmt(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted">IVA 10%</span>
              <span className="font-medium text-foreground">{fmt(iva)}</span>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-base font-bold text-foreground">Total</span>
              <span className="text-base font-bold text-primary">{fmt(total)}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Aceptar
        </button>
      </div>
    </Modal>
  );
}