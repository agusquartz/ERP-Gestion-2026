"use client";
import { useState } from "react";


/**
 * Hook para la creación de pedidos de compra.
 * Gestiona ítems, cantidades y totales para posterior revisión.
 */
export function usePurchaseForm() {
 // Estado para los ítems (inicializado con mock para pruebas) 
  const [items, setItems] = useState([]);
  const [submitError, setSubmitError] = useState("");

  // Solo subtotal, sin IVA
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const totalItems = items.length;
  const totalUnidades = items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0);

  const addItem = (product, qty) => {
    // En compras usamos el precio de costo del producto
    const precio = Number(product.cost) || 0;
    const cantidad = Number(qty) || 1;
    const existing = items.find((i) => i.codigo === product.code);

    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.codigo === product.code
            ? { ...i, cantidad: i.cantidad + cantidad, 
              subtotal: (i.cantidad + cantidad) * i.costo }
            : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          productoId: product.id,
          codigo: product.code,
          descripcion: product.description,
          categoria: product.category?.name,
          cantidad: cantidad,
          costo: product.cost,
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
          ? { ...i, cantidad, subtotal: cantidad * (Number(i.costo) || 0) } 
          : i
      )
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const reset = () => {
    setItems([]);
    setSubmitError("");
  };

  const buildPayload = () => {
    return {
      // Coincide con 'pub created_at: NaiveDate' (camelCase -> createdAt)
      createdAt: new Date().toISOString().split('T')[0], 
      
      // Coincide con 'pub employee_id: i32' (camelCase -> employeeId)
      // Aquí deberías usar el ID del usuario logueado. Por ahora un quemado:
      employeeId: 1, 
      
      // Coincide con 'pub details: Vec<CreatePurchaseRequestDetailDto>'
      details: items.map((i) => ({
        // Dentro de details, camelCase aplica también:
        productId: i.productoId, // 'product_id' en Rust
        quantity: i.cantidad,    // 'quantity' en Rust
      })),
    };
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
    reset,
    buildPayload
  };
}