"use client";
import { useState, useEffect } from "react";
import { whoAmI } from "@/lib/http/client/auth"; 


/**
 * Hook para la creación de pedidos de compra.
 * Gestiona ítems, cantidades y totales para posterior revisión.
 */
export function usePurchaseForm() { 
  const [items, setItems] = useState([]);
  const [submitError, setSubmitError] = useState("");
  

  // Solo subtotal, sin IVA
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const totalItems = items.length;
  const totalUnidades = items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0);
  const [employeeId, setEmployeeId] = useState(null);

    useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await whoAmI();
        // OJO: Verifica cómo viene la respuesta de tu backend.
        // Si el JSON es { "id": 5, "username": "admin" }, usas user.id
        // Si es { "employee_id": 5 }, usas user.employee_id
        setEmployeeId(user.id); 
      } catch (error) {
        console.error("Error al obtener la sesión del usuario:", error);
      }
    };

    fetchUser();
    }, []); // El array vacío asegura que solo se ejecute una vez al cargar

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
    // Pequeña validación de seguridad
    if (!employeeId) {
      console.warn("Advertencia: No se ha cargado el ID del empleado aún.");
    }
    return {
      createdAt: new Date().toISOString().split('T')[0], 
      
      // Aquí deberías usar el ID del usuario logueado:
      employeeId: employeeId, 
      
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