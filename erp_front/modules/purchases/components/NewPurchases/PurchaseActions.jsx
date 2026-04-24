"use client";
import { s } from "../../styles/NewPurchase/NewPurchasesStyles";

export function PurchaseActions({ onCancel, onRegister }) {
  return (
    <div style={s.actions}>
      <button style={s.btnCancel} onClick={onCancel}>
        Cancelar Operación
      </button>
      <button style={s.btnOrder}>
        Guardar Borrador
      </button>
      <button style={s.btnRegister} onClick={onRegister}>
        Registrar Factura de Compra
      </button>
    </div>
  );
}