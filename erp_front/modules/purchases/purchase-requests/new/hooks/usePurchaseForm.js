"use client";
import { useState } from "react";
import { mock_items } from "../../services/NewPurchase/mock";


/**
 * Hook para la creación de pedidos de compra.
 * Gestiona ítems, cantidades y totales para posterior revisión.
 */
export function usePurchaseForm() {
 // Estado para los ítems (inicializado con mock para pruebas) 
  const [items, setItems] = useState(mock_items);
  const [submitError, setSubmitError] = useState("");

  // Solo subtotal, sin IVA
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const totalItems = items.length;
  const totalUnidades = items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0);

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
          categoria: product.categoria || "GENERAL",
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
      prev.map((i) => 
        i.id === id 
          ? { ...i, cantidad, subtotal: cantidad * (Number(i.precio) || 0) } 
          : i
      )
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const reset = () => {
    setItems([]);
    setSubmitError("");
  };

  return {
    items,
    subtotal,
    totalItems,
    totalUnidades,
    submitError,
    addItem,
    updateItemQty,
    removeItem,
    reset
  };
}