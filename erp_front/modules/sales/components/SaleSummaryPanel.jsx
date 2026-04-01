"use client";

import { s } from "../styles/salesStyles";

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
    <div style={s.panelCard}>
      <p style={s.panelTitle}>RESUMEN</p>

      <div style={s.summaryRow}>
        <span>Subtotal:</span>
        <span>{fmt(subtotal)}</span>
      </div>
      <div style={s.summaryRow}>
        <span>IVA 10%:</span>
        <span>{fmt(iva)}</span>
      </div>
      <div style={{ ...s.summaryRow, ...s.summaryDivider }}>
        <span>Total:</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
}
