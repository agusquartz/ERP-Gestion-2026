"use client";

import { useState } from "react";
import { SearchIcon } from "@/shared/components/Icons";

export function AddPurchaseProductPanel({ onAdd, onOpenSearch, selectedProduct, onClearProduct }) {
  const [manualCode, setManualCode] = useState("");
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState({});

  const price = selectedProduct?.precioCompra ?? selectedProduct?.precio ?? 0;

  const handleAdd = () => {
    if (!selectedProduct && !manualCode.trim()) {
      setErrors({ codigo: "Ingresá un producto" });
      return;
    }
    onAdd(selectedProduct || { codigo: manualCode, descripcion: "", precio: 0 }, qty);
    setManualCode("");
    setQty(1);
    onClearProduct?.();
  };

  return (
    <div className="rounded-[5px] border-l-[3px] border-primary bg-surface p-4 shadow-panel">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Agregar item de compra</p>
      
      <label className="mb-1 block text-xs font-semibold text-foreground">Código</label>
      <div className="flex gap-2 mb-3">
        <input
          className="w-full rounded-[5px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="Código del producto..."
          value={selectedProduct?.codigo ?? manualCode}
          onChange={(e) => { setManualCode(e.target.value); onClearProduct?.(); }}
        />
        <button type="button" onClick={onOpenSearch} className="h-10 w-10 bg-[#FFE6E5] flex items-center justify-center rounded-[5px] border border-primary text-primary hover:bg-primary/5">
          <SearchIcon />
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 bg-[#FFE6E5]">
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">Precio Unit.</label>
          <div className="flex h-10 items-center rounded-[5px] border border-border bg-background px-3 text-sm font-medium">${price}</div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">Cantidad</label>
          <input type="number" className="w-full h-10 rounded-[5px] border border-border px-3 text-sm" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        </div>
      </div>

      <button onClick={handleAdd} className="h-10 w-full rounded-[5px] border border-primary text-sm font-semibold text-primary hover:bg-primary/5 transition-all">
        Agregar al pedido
      </button>
    </div>
  );
}