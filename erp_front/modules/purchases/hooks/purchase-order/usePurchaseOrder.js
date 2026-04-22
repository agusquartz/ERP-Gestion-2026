/**
 * @file usePurchaseOrder.js
 * @module modules/purchases/hooks/purchase-order
 *
 * @description
 * Custom hook that centralizes all state and business logic for the
 * Purchase Order page. Components only call handlers from here —
 * they never manage state directly.
 *
 * Responsibilities:
 *  - Fetching purchase order data (header, items, suppliers).
 *  - Deriving the categories summary from order items.
 *  - Managing modal open/close state.
 *  - Handling quotation save and supplier status transitions.
 *  - Handling "Generar Todos" and "Agregar Proveedores" actions.
 *
 * @param {string} orderId - The ID of the purchase order to load.
 *
 * @returns {Object} All state and handlers needed by PurchaseOrderPage and its children.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getPurchaseOrder,
  getPurchaseOrderItems,
  getPurchaseOrderSuppliers,
  saveQuotation,
  generateAllQuotations,
  addSuppliers,
} from "../../services/purchaseOrderService";

export function usePurchaseOrder(orderId) {
  // ── Server data ─────────────────────────────────────────────────────────────
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [orderItems, setOrderItems]       = useState([]);
  const [suppliers, setSuppliers]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  // ── Modal state ─────────────────────────────────────────────────────────────

  /** Supplier currently open in the QuotationModal (null = closed) */
  const [activeSupplier, setActiveSupplier] = useState(null);

  /** Controls visibility of the SupplierSearchModal */
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);

  // ── Data fetching ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!orderId) return;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        // TODO: These run in parallel — if your backend supports it, keep Promise.all.
        // If there are dependencies between calls, switch to sequential awaits.
        const [order, items, sups] = await Promise.all([
          getPurchaseOrder(orderId),
          getPurchaseOrderItems(orderId),
          getPurchaseOrderSuppliers(orderId),
        ]);
        setPurchaseOrder(order);
        setOrderItems(items);
        setSuppliers(sups);
      } catch (err) {
        // TODO: Replace with your app's error handling / toast system
        console.error("Error loading purchase order:", err);
        setError("No se pudo cargar el pedido de compra.");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [orderId]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  /**
   * Unique categories derived from order items.
   * Each entry includes product count and how many suppliers are already assigned
   * (status is not "generar").
   *
   * TODO: "assignedSuppliers" count may come directly from the backend in the future.
   *       If so, remove this derivation and use the API value instead.
   */
  const categories = useMemo(() => {
    const map = {};
    orderItems.forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = { category: item.category, productCount: 0 };
      }
      map[item.category].productCount += 1;
    });

    const assignedCount = suppliers.filter((s) => s.status !== "generar").length;

    return Object.values(map).map((cat) => ({
      ...cat,
      // TODO: ideally per-category assigned count — simplify once backend provides it
      assignedSuppliers: assignedCount,
    }));
  }, [orderItems, suppliers]);

  /** Unique category names — passed to SupplierSearchModal and service layer */
  const categoryNames = useMemo(
    () => [...new Set(orderItems.map((i) => i.category))],
    [orderItems]
  );

  // ── Quotation modal handlers ─────────────────────────────────────────────────

  /** Opens the QuotationModal for a given supplier. */
  const handleOpenQuotation = (supplier) => setActiveSupplier(supplier);

  /** Closes the QuotationModal. */
  const handleCloseQuotation = () => setActiveSupplier(null);

  /**
   * Saves the filled-in quotation and advances the supplier's status.
   *
   * Status transitions:
   *   "generar"   → "pendiente"  (quotation generated for the first time)
   *   "pendiente" → "listo"      (supplier responded, data filled in)
   *
   * @param {number} supplierId    - Supplier being updated.
   * @param {Array}  updatedRows   - New quotation rows from the modal.
   */
  const handleSaveQuotation = async (supplierId, updatedRows) => {
    try {
      // TODO: Remove optimistic update if your backend is slow or unreliable.
      // Currently we update UI immediately and fire the API in background.
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== supplierId) return s;
          const nextStatus = s.status === "generar" ? "pendiente" : "listo";
          return { ...s, status: nextStatus, quotationItems: updatedRows };
        })
      );
      await saveQuotation(orderId, supplierId, updatedRows);
    } catch (err) {
      // TODO: Show error toast and revert optimistic update
      console.error("Error saving quotation:", err);
    }
  };

  // ── Generate all handler ─────────────────────────────────────────────────────

  /**
   * Transitions all "generar" suppliers to "pendiente" and notifies the backend.
   *
   * TODO: After backend call, re-fetch suppliers to get server-confirmed statuses.
   */
  const handleGenerateAll = async () => {
    try {
      setSuppliers((prev) =>
        prev.map((s) => (s.status === "generar" ? { ...s, status: "pendiente" } : s))
      );
      await generateAllQuotations(orderId);
    } catch (err) {
      // TODO: Show error toast and revert
      console.error("Error generating all quotations:", err);
    }
  };

  // ── Supplier search modal handlers ───────────────────────────────────────────

  /** Opens the SupplierSearchModal. */
  const handleOpenSupplierSearch = () => setIsSupplierSearchOpen(true);

  /** Closes the SupplierSearchModal. */
  const handleCloseSupplierSearch = () => setIsSupplierSearchOpen(false);

  /**
   * Adds one or more selected suppliers to the order.
   * Closes the modal and refreshes the supplier list.
   *
   * @param {Array} selectedSuppliers - Supplier objects chosen in the modal.
   */
  const handleAddSuppliers = async (selectedSuppliers) => {
    try {
      const ids = selectedSuppliers.map((s) => s.id);
      await addSuppliers(orderId, ids);

      // Append new suppliers in "generar" status with empty quotation rows
      const newSuppliers = selectedSuppliers.map((s) => ({
        id: s.id,
        name: s.name,
        status: "generar",
        quotationItems: orderItems.map((item) => ({
          orderItemId: item.id,
          confirmedQty: 0,
          unitPrice: 0,
        })),
      }));

      setSuppliers((prev) => [...prev, ...newSuppliers]);
      setIsSupplierSearchOpen(false);
    } catch (err) {
      // TODO: Show error toast
      console.error("Error adding suppliers:", err);
    }
  };

  // ── Print handler ────────────────────────────────────────────────────────────

  /** Triggers browser print for the current quotation. */
  const handlePrint = () => window.print();

  // ── Return ───────────────────────────────────────────────────────────────────

  return {
    // Data
    purchaseOrder,
    orderItems,
    suppliers,
    categories,
    categoryNames,
    loading,
    error,

    // Quotation modal
    activeSupplier,
    handleOpenQuotation,
    handleCloseQuotation,
    handleSaveQuotation,
    handlePrint,

    // Supplier search modal
    isSupplierSearchOpen,
    handleOpenSupplierSearch,
    handleCloseSupplierSearch,
    handleAddSuppliers,

    // Page actions
    handleGenerateAll,
  };
}
