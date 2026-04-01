"use client";

import { s } from "../styles/salesStyles";

/**
 * Botones al pie de la tabla.
 *
 * Props:
 *   onCancel   - limpiar formulario
 *   onQuote    - crear presupuesto
 *   onInvoice  - crear factura
 */
export function SaleActions({ onCancel, onQuote, onInvoice }) {
  return (
    <div style={s.actions}>
    
    <div> 
      <button style={s.btnCancel} onClick={onCancel}>Cancelar</button>
    </div>
    
    <div style={{ flex: 1, textAlign: "center"}}> 
      <button style={s.btnQuote}  onClick={onQuote}>Crear Presupuesto</button>
    </div>
    
    <div style={{textAlign: "right"}}> 
      <button style={s.btnInvoice} onClick={onInvoice}>Crear Factura</button>
    </div>

    </div>
  );
}
