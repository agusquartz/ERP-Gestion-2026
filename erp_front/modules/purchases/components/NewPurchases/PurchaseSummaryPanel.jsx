"use client";

import { s } from "../../styles/NewPurchase/NewPurchasesStyles";

export function PurchaseSummaryPanel({ subtotal, iva, total }) {
  return (
    <div style={s.panelCard}>
      <h3 style={s.panelTitle}>RESUMEN DE COMPRA</h3>
      <div style={s.summaryRow}>
        <span>Subtotal:</span>
        {/* El "|| 0" asegura que si subtotal es undefined, use 0 */}
        <span>{(subtotal || 0).toLocaleString()} Gs.</span>
      </div>

      <div style={s.summaryRow}>
        <span>IVA (10%):</span>
        <span>{(iva || 0).toLocaleString()} Gs.</span>
      </div>

      <div style={{ ...s.summaryRow, ...s.summaryDivider }}>
        <span>TOTAL:</span>
        <span style={{ fontSize: 18 }}>{(total || 0).toLocaleString()} Gs.</span>
      </div>
    </div>
  );
}