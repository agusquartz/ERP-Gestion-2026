"use client";

import { useState } from "react";
import { SearchIcon } from "@/shared/components/Icons";
import { getProductByCode } from "@/lib/http/client/sales"; 

export function AddProductPanel({
  onAdd,
  onOpenSearch,
  selectedProduct,
  onClearProduct,
  onProductFound,
}) {
  const [manualCode, setManualCode] = useState("");
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const displayCode = selectedProduct?.code ?? manualCode;
  const displayDesc = selectedProduct?.description ?? "";
  const price = selectedProduct?.price ?? "";

  const validate = () => {
    const e = {};

    if (!selectedProduct && !manualCode.trim()) {
      e.code = "Ingresá o buscá un producto";
    }

    if (!qty || qty < 1) {
      e.qty = "Cantidad inválida";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    if (loading) return;

    setLoading(true);
    setErrors({});

    try {
      let product = selectedProduct;

      if (!product) {
        const code = manualCode.trim();

        const found = await getProductByCode(code);

        if (!found) {
          setErrors({
            code: "No se encontró un producto con ese código",
          });
          return;
        }

        product = found;
      }

      if (!product?.id) {
        setErrors({
          code: "Producto inválido",
        });
        return;
      }

      onAdd(product, qty);

      // reset estado
      setManualCode("");
      setQty(1);
      setErrors({});
      onClearProduct?.();
    } catch (err) {
      setErrors({
        code: "Error al buscar el producto",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleKeyDown = async (e) => {
  if (e.key !== "Enter") return;

  e.preventDefault();

  const code = manualCode.trim();

  if (!code) return;

  try {
    setLoading(true);
    setErrors({});

    const product = await getProductByCode(code);

    if (!product) {
      setErrors({
        code: "Producto no encontrado",
      });
      return;
    }

    onProductFound(product);
  } catch (err) {
    setErrors({
      code: "Error buscando producto",
    });
  } finally {
    setLoading(false);
  }
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

      <div className={`flex gap-2 ${errors.code ? "mb-0" : "mb-3"}`}>
        <input
          className={`${inputBase} flex-1 ${
            errors.code ? errorInput : ""
          }`}
          placeholder="Escanea o escribe código..."
          value={displayCode}
          onChange={(e) => {
            setManualCode(e.target.value);
            onClearProduct?.();
          }}
          onKeyDown={handleKeyDown}
        />

        <button
          type="button"
          onClick={onOpenSearch}
          className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-[5px] border border-primary text-primary transition-all duration-200 hover:bg-primary/5 active:translate-y-px"
        >
          <SearchIcon />
        </button>
      </div>

      {errors.code && (
        <span className="mb-2 block text-[11px] text-destructive">
          {errors.code}
        </span>
      )}

      {/* DESCRIPCION */}
      <label className="mb-1 block text-xs font-semibold text-foreground">
        Descripción
      </label>

      <textarea
        className="mb-3 h-[52px] w-full resize-none rounded-[5px] border border-border bg-background px-3 py-2 text-xs text-muted-foreground outline-none"
        value={displayDesc}
        placeholder="Sin descripción"
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
            {price ? `$${price}` : "-"}
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
        disabled={loading}
        className="cursor-pointer flex h-10 w-full items-center justify-center rounded-[5px] border border-primary text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/5 active:translate-y-px disabled:opacity-50"
      >
        {loading ? "Buscando..." : "Agregar"}
      </button>
    </div>
  );
}