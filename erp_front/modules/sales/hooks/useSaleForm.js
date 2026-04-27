"use client";

import { useState } from "react";

/**
 * Hook central del módulo de ventas.
 * Centraliza: items, cliente, totales y validaciones.
 */
export function useSaleForm() {
  const [clients, setClients]           = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [items, setItems]               = useState([]);
  const [submitError, setSubmitError]   = useState("");
  
  //const [ivaRate] = useState(0.1); //10%
  const [seller] = useState("Juan Perez");
  // ── Totales ──────────────────────────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  //const iva      = subtotal * ivaRate;
  const total    = subtotal;

  // ── Items ────────────────────────────────────────────────────────────────
  const addItem = (product, qty) => {
    const price = Number(product.price) || 0;
    const quantity = Number(qty) || 1;

    const existing = items.find((i) => i.productoId === product.id);

    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.productoId === product.id
            ? {
                ...i,
                cantidad: i.cantidad + quantity,
                subtotal: (i.cantidad + quantity) * i.price,
              }
            : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          productoId: product.id,
          code: product.code,
          description: product.description,
          cantidad: quantity,
          price,
          subtotal: quantity * price,
        },
      ]);
    }
  };

  const updateItemQty = (id, val) => {
    const cantidad = Math.max(1, Number(val) || 1);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, cantidad, subtotal: cantidad * (i.price || 0) }
          : i
      )
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  // ── Cliente ───────────────────────────────────────────────────────────────
  const selectClient = (client) => {
    setSelectedClient(client);
    setSubmitError("");
  };

  const addClient = (data) => {
    const created = { ...data, id: Date.now() };
    setClients((prev = []) => [...prev, created]);
    selectClient(created);
    return created;
  };

  // ── Validación ────────────────────────────────────────────────────────────
  const validate = () => {
    if (!selectedClient) {
      setSubmitError("Debés seleccionar un cliente antes de continuar.");
      return false;
    }
    if (items.length === 0) {
      setSubmitError("Agregá al menos un producto a la venta.");
      return false;
    }
    setSubmitError("");
    return true;
  };

  const reset = () => {
    setItems([]);
    setSelectedClient(null);
    setSubmitError("");
  };

  // ── Payload para la API ───────────────────────────────────────────────────
  const buildPayload = () => ({
    clienteId: selectedClient?.id,
    vendedor:  "Juan Perez",
    items:     items.map(({ productoId, cantidad, price }) => ({ productoId, cantidad, price })),
  });

  return {
    // state
    clients, setClients,
    selectedClient,
    items,
    subtotal, total,
    submitError,
    seller,
    // actions
    addItem,
    updateItemQty,
    removeItem,
    selectClient,
    addClient,
    validate,
    reset,
    buildPayload,
  };
}
