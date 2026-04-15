"use client";

import { useState } from "react";
import { SearchIcon } from "@/shared/components/Icons";

export function AddProductPanel({
  onAdd,
  onOpenSearch,
  selectedProduct,
  onClearProduct,
}) {
  const [manualCode, setManualCode] = useState("");
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState({});

  const displayCode = selectedProduct?.codigo ?? manualCode;
  const displayDesc = selectedProduct?.descripcion ?? "";
  const price = selectedProduct?.precio ?? 0;

  const validate = () => {
    const e = {};
    if (!selectedProduct && !manualCode.trim())
      e.codigo = "Ingresá o buscá un producto";
    if (!qty || qty < 1) e.qty = "Cantidad inválida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;

    const prod = selectedProduct ?? {
      codigo: manualCode,
      descripcion: "",
      precio: 0,
    };

    onAdd(prod, qty);
    setManualCode("");
    setQty(1);
    setErrors({});
    onClearProduct?.();
  };

  const inputBase =
    "w-full rounded-[5px] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all duration-200 " +
    "placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15";

  const errorInput =
    "border-destructive focus:border-destructive focus:ring-destructive/15";

  return (
    <div className="rounded-[5px] border-l-[3px] border-primary bg-surface p-4 shadow-panel">
      
      {/* TITLE */}
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        Agregar producto
      </p>

      {/* CODIGO */}
      <label className="mb-1 block text-xs font-semibold text-foreground">
        Código
      </label>

      <div className={`flex gap-2 ${errors.codigo ? "mb-0" : "mb-3"}`}>
        <input
          className={`${inputBase} flex-1 ${
            errors.codigo ? errorInput : ""
          }`}
          placeholder="Escanea producto..."
          value={displayCode}
          onChange={(e) => {
            setManualCode(e.target.value);
            onClearProduct?.();
          }}
        />

        <button
          type="button"
          onClick={onOpenSearch}
          className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-[5px] border border-primary text-primary transition-all duration-200 hover:bg-primary/5 active:translate-y-px"
        >
          <SearchIcon />
        </button>
      </div>

      {errors.codigo && (
        <span className="mb-2 block text-[11px] text-destructive">
          {errors.codigo}
        </span>
      )}

      {/* DESCRIPCION */}
      <label className="mb-1 block text-xs font-semibold text-foreground">
        Descripción
      </label>

      <textarea
        className="mb-3 h-[52px] w-full resize-none rounded-[5px] border border-border bg-background px-3 py-2 text-xs text-muted-foreground outline-none"
        value={displayDesc}
        placeholder="Escanea producto..."
        readOnly
      />

      {/* PRICE + QTY */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        
        {/* PRECIO */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">
            Precio
          </label>
          <div className="flex h-10 items-center rounded-[5px] border border-border bg-background px-3 text-sm font-medium text-foreground">
            ${price}
          </div>
        </div>

        {/* CANTIDAD */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">
            Cantidad
          </label>
          <input
            type="number"
            min={1}
            className={`${inputBase} ${
              errors.qty ? errorInput : ""
            }`}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </div>
      </div>

      {errors.qty && (
        <span className="mb-2 block text-[11px] text-destructive">
          {errors.qty}
        </span>
      )}

      {/* BUTTON */}
      <button
        type="button"
        onClick={handleAdd}
        className="cursor-pointer flex h-10 w-full items-center justify-center rounded-[5px] border border-primary text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/5 active:translate-y-px"
      >
        Agregar
      </button>
    </div>
  );
}