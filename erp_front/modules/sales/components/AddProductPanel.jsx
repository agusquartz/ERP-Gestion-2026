"use client";

import { useState } from "react";
import { s } from "../styles/salesStyles";
import { SearchIcon } from "@/shared/components/Icons";

/**
 * Panel derecho para agregar productos a la venta.
 *
 * Props:
 *   onAdd            - (product, qty) => void
 *   onOpenSearch     - () => void — abre ProductSearchModal
 *   selectedProduct  - producto pre-cargado desde el modal (o null)
 *   onClearProduct   - () => void — limpia el producto seleccionado
 */
export function AddProductPanel({ onAdd, onOpenSearch, selectedProduct, onClearProduct }) {
  const [manualCode, setManualCode] = useState("");
  const [qty, setQty]               = useState(1);
  const [errors, setErrors]         = useState({});

  const displayCode = selectedProduct?.codigo ?? manualCode;
  const displayDesc = selectedProduct?.descripcion ?? "";

  const validate = () => {
    const e = {};
    if (!selectedProduct && !manualCode.trim()) e.codigo = "Ingresá o buscá un producto";
    if (!qty || qty < 1) e.qty = "Cantidad inválida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const prod = selectedProduct ?? { codigo: manualCode, descripcion: "", precio: 0 };
    onAdd(prod, qty);
    // reset
    setManualCode("");
    setQty(1);
    setErrors({});
    onClearProduct();
  };

  return (
    <div style={s.panelCard}>
      <p style={s.panelTitle}>AGREGAR PRODUCTO</p>

      {/* Código */}
      <label style={s.label}>Código:</label>
      <div style={{ display: "flex", gap: 6, marginBottom: errors.codigo ? 2 : 10 }}>
        <input
          style={{ ...s.input, flex: 1, ...(errors.codigo ? s.inputError : {}) }}
          placeholder="Escanea producto..."
          value={displayCode}
          onChange={(e) => { setManualCode(e.target.value); onClearProduct(); }}
        />
        <button style={s.btnSearchCode} onClick={onOpenSearch} title="Buscar producto">
          <SearchIcon />
        </button>
      </div>
      {errors.codigo && <span style={s.errorMsg}>{errors.codigo}</span>}

      {/* Descripción (solo lectura) */}
      <label style={s.label}>Descripción</label>
      <textarea
        style={{ ...s.input, resize: "none", height: 52, fontSize: 12, color: "#6B7280" }}
        placeholder="Escanea producto..."
        value={displayDesc}
        readOnly
      />

      {/* Cantidad */}
      <label style={s.label}>Cantidad:</label>
      <input
        type="number"
        min={1}
        style={{ ...s.input, ...(errors.qty ? s.inputError : {}) }}
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
      />
      {errors.qty && <span style={s.errorMsg}>{errors.qty}</span>}

      <button style={{ ...s.btnPrimary, marginTop: 14, width: "100%" }} onClick={handleAdd}>
        Agregar
      </button>
    </div>
  );
}
