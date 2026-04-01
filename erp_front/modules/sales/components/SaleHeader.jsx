"use client";

import { s } from "../styles/salesStyles";
import { VENDEDOR } from "../constants/mockData";

/**
 * Fila superior: cliente seleccionado + botón buscar + vendedor.
 *
 * Props:
 *   selectedClient   - objeto cliente | null
 *   onBuscarCliente  - () => void — abre el modal de clientes
 */
export function SaleHeader({ selectedClient, onBuscarCliente}) {
  return(
    <div style={{background: "white", borderRadius: 5, border: "1px solid #E5E7EB", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18}}>
      {/* Cliente */}
      <div style={{display: "flex", alignItems: "center", gap: 10}}>
        <span style={s.fieldLabel}>Cliente: </span>
        {selectedClient ? (
          <span style={s.clientName}>{selectedClient.nombre} {selectedClient.apellido}</span>
        ) : (
          <span style={{color: "#aaa", fontSize: 14}}>Sin cliente</span>
        )}
        <button style={s.btnBuscarCliente} onClick={onBuscarCliente}>
          Buscar Cliente
        </button>
      </div>

      {/* Vendedor */}
      <div style={{display: "flex", alignItems: "center", gap: 10}}>
        <span style={s.fieldLabel}>Vendedor</span>
        <span style={{fontSize: 14, color: "#333"}}>{VENDEDOR}</span>
      </div>
    </div>
  );
}
