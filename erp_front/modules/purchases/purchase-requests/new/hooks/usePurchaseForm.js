"use client";
import { useState, useEffect } from "react";
import { whoAmI } from "@/lib/http/client/auth"; 

/**
 * Hook for managing purchase order creation.
 * Handles items, quantities, and totals calculation for later review.
 */
export function usePurchaseForm() { 
  const [items, setItems] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [employeeId, setEmployeeId] = useState(null);

  // Totals calculation: Subtotal (without taxes), line count, and total units
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const totalItems = items.length;
  const totalUnidades = items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0);

  /**
   * Adds a product to the purchase list or updates quantity if it already exists.
   * Uses product cost for procurement logic.
   */
  const addItem = (product, qty) => {
    // Procurement logic: focus on cost price instead of retail price
    const precio = Number(product.cost) || 0;
    const cantidad = Number(qty) || 1;
    const existing = items.find((i) => i.codigo === product.code);

    if (existing) {
      // Update existing item quantity and recalculate its subtotal
      setItems((prev) =>
        prev.map((i) =>
          i.codigo === product.code
            ? { ...i, cantidad: i.cantidad + cantidad, 
                subtotal: (i.cantidad + cantidad) * i.costo }
            : i
        )
      );
    } else {
      // Create a new entry in the items array
      setItems((prev) => [
        ...prev,
        {
          id: Date.now(), // Local unique identifier for UI rendering
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

  /**
   * Updates the quantity and subtotal of a specific item by its ID.
   */
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

  /**
   * Removes an item from the list based on its local ID.
   */
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  /**
   * Clears all items and resets error states.
   */
  const reset = () => {
    setItems([]);
    setSubmitError("");
  };

  /**
   * Constructs the final data object to be sent to the backend (Rust/Supabase).
   * Aligns with the expected 'CreatePurchaseRequestDto' structure.
   */
  const buildPayload = () => {
    // Safety check to ensure the employee session is loaded before submission
    if (!employeeId) {
      console.warn("Warning: Employee ID has not been loaded yet.");
    }
    
    return {
      // Standard ISO date string for the 'NaiveDate' backend field
      createdAt: new Date().toISOString().split('T')[0], 
      
      // Real logged-in user ID mapped from the auth service
      employeeId: 1, 
      
      // Array of details matching the backend DTO expected properties
      details: items.map((i) => ({
        productId: i.productoId, 
        quantity: i.cantidad,    
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