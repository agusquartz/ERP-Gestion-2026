"use client";
import { useState } from "react";
import { mock_items } from "../services/mock";

export function usePurchaseForm() {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [items, setItems] = useState(mock_items);
  const [submitError, setSubmitError] = useState("");
  const [ivaRate] = useState(0.1); 

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const iva = subtotal * ivaRate;
  const total = subtotal + iva;

  const addItem = (product, qty) => {
    // En compras usamos el precio de costo del producto
    const precio = Number(product.precioCompra || product.precio) || 0;
    const cantidad = Number(qty) || 1;
    const existing = items.find((i) => i.codigo === product.codigo);

    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.codigo === product.codigo
            ? { ...i, cantidad: i.cantidad + cantidad, subtotal: (i.cantidad + cantidad) * precio }
            : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          productoId: product.id,
          codigo: product.codigo,
          descripcion: product.descripcion,
          cantidad,
          precio,
          subtotal: cantidad * precio,
        },
      ]);
    }
  };

  const updateItemQty = (id, val) => {
    const cantidad = Math.max(1, Number(val) || 1);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad, subtotal: cantidad * i.precio } : i))
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const selectProvider = (provider) => {
    setSelectedProvider(provider);
    setSubmitError("");
  };

  const reset = () => {
    setItems([]);
    setSelectedProvider(null);
    setSubmitError("");
  };

  return {
    selectedProvider, items, subtotal, iva, total, submitError,
    addItem, updateItemQty, removeItem, selectProvider, reset
  };
}