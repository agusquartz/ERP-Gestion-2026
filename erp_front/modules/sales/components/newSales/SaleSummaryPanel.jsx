"use client";

const fmt = (n) => `$${Number(n).toFixed(0)}`;

/**
 * Panel resumen con subtotal, IVA y total.
 *
 * Props:
 *   subtotal - number
 *   iva      - number
 *   total    - number
 */
export function SaleSummaryPanel({ subtotal, iva, total }) {
  return (
    <div className="rounded-[5px] border border-border bg-surface p-4 shadow-panel">
      <p className="mb-3 text-lg font-bold uppercase tracking-[0.08em] text-black">
        Resumen
      </p>

      <div className="space-y-1 text-sm text-foreground">
        <div className="flex items-center justify-between py-0.5">
          <span>Subtotal:</span>
          <span>{fmt(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <span>IVA 10%:</span>
          <span>{fmt(iva)}</span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-base font-bold">
          <span>Total:</span>
          <span>{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}