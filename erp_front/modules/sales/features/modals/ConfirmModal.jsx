"use client";

import { Modal } from "@/shared/components/Modal";
import { s }     from "../../styles/salesStyles";

const fmt = (n) => `$${Number(n).toFixed(0)}`;

/**
 * Modal de confirmación tras crear factura o presupuesto.
 *
 * Props:
 *   open     - boolean
 *   onClose  - () => void
 *   type     - "factura" | "presupuesto"
 *   client   - objeto cliente
 *   subtotal, iva, total - numbers
 */
export function ConfirmModal({ open, onClose, type, client, subtotal, iva, total }) {
  const isFactura = type === "factura";
  const label = isFactura ? "Factura" : "Presupuesto";
  const emoji = isFactura ? "🧾" : "📋";

  return (
    <Modal open={open} onClose={onClose} width={400}>
      <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{emoji}</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{label} creado</h2>
        <p style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
          {label} para{" "}
          <strong>{client?.nombre} {client?.apellido}</strong>{" "}
          por <strong>{fmt(total)}</strong> generado exitosamente.
        </p>

        <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "12px 16px", textAlign: "left", marginBottom: 20, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>IVA 10%</span><span>{fmt(iva)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid #E5E7EB", paddingTop: 8, marginTop: 4 }}>
            <span>Total</span><span>{fmt(total)}</span>
          </div>
        </div>

        <button style={{ ...s.btnPrimary, width: "100%" }} onClick={onClose}>
          Aceptar
        </button>
      </div>
    </Modal>
  );
}
