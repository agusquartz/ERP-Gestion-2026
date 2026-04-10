"use client";

import { useState } from "react";

/**
 * Hook central del módulo de ventas.
 * Centraliza: items, cliente, totales y validaciones.
 */
export function useSaleForm() {
  const [clients, setClients]           = useState(MOCK_CLIENTS);
  const [selectedClient, setSelectedClient] = useState(null);
  const [items, setItems]               = useState([]);
  const [submitError, setSubmitError]   = useState("");

  // ── Totales ──────────────────────────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const iva      = subtotal * IVA_RATE;
  const total    = subtotal + iva;

  // ── Items ────────────────────────────────────────────────────────────────
  const addItem = (product, qty) => {
    const precio   = Number(product.precio) || 0;
    const cantidad = Number(qty) || 1;
    const existing = items.find((i) => i.codigo === product.codigo);

    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.codigo === product.codigo
            ? { ...i, cantidad: i.cantidad + cantidad, subtotal: (i.cantidad + cantidad) * i.precio }
            : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id:          Date.now(),
          productoId:  product.id,
          codigo:      product.codigo,
          descripcion: product.descripcion,
          cantidad,
          precio,
          subtotal:    cantidad * precio,
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

  // ── Cliente ───────────────────────────────────────────────────────────────
  const selectClient = (client) => {
    setSelectedClient(client);
    setSubmitError("");
  };

  const addClient = (data) => {
    const created = { ...data, id: Date.now() };
    setClients((prev) => [...prev, created]);
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
    items:     items.map(({ productoId, cantidad, precio }) => ({ productoId, cantidad, precio })),
  });

  return {
    // state
    clients, setClients,
    selectedClient,
    items,
    subtotal, iva, total,
    submitError,
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
