/**
 * @file usePurchaseOrder.js
 * @module modules/purchases/hooks/purchase-order
 *
 * @description
 * Custom hook that centralizes all state and business logic for the
 * Purchase Order page. Components only receive handlers from here —
 * they never manage state or call services directly.
 *
 * Responsibilities:
 *  - Fetching purchase order data (header, items, suppliers) on mount.
 *  - Deriving the categories summary table from order items.
 *  - Managing QuotationModal and SupplierSearchModal open/close state.
 *  - Handling quotation save and supplier status transitions.
 *  - Tracking whether "Generar Todos" has been fired, so SuppliersTable
 *    can swap the button label to "Imprimir Todos". The label resets to
 *    "Generar Todos" whenever a new supplier is added.
 *
 * @param {string} orderId - The ID of the purchase order to load.
 *
 * @returns {Object} All state and handlers consumed by PurchaseOrderPage and its children.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getPurchaseOrder,
  getPurchaseOrderItems,
  getPurchaseOrderSuppliers,
  saveQuotation,
  generateAllQuotations,
  printAllQuotations,
  addSuppliers,
} from "../../services/purchaseOrderService";

export function usePurchaseOrder(orderId) {
  // ── Server data ─────────────────────────────────────────────────────────────
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [orderItems, setOrderItems]       = useState([]);
  const [suppliers, setSuppliers]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);


  // ── Modal visibility ────────────────────────────────────────────────────────
  
  /** The supplier whose QuotationModal is currently open. null = modal closed. */
  const [activeSupplier, setActiveSupplier] = useState(null);

  /** Whether the SupplierSearchModal is visible. */
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);

  // ── "Generar Todos" / "Imprimir Todos" toggle ────────────────────────────────
  /**
   * Tracks whether "Generar Todos" has been executed at least once for this order.
   * - false → button reads "Generar Todos"
   * - true  → button reads "Imprimir Todos"
   *
   * Resets to false whenever the user adds a new supplier, because there is now
   * at least one supplier in "generar" status that hasn't been notified yet.
   */
  const [allGenerated, setAllGenerated] = useState(false);


  // ── Data fetching ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!orderId) return;


    /**
     * Loads all purchase order data in parallel.
     * Falls back to an error state if any request fails.
     */

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        // If there are dependencies between calls, switch to sequential awaits.
        // TODO: These run in parallel — if your backend supports it, keep Promise.all.
        const [order, items, sups] = await Promise.all([
          getPurchaseOrder(orderId),
          getPurchaseOrderItems(orderId),
          getPurchaseOrderSuppliers(orderId),
        ]);
        setPurchaseOrder(order);
        setOrderItems(items);
        setSuppliers(sups);
        

        // If all existing suppliers are already past "generar", show "Imprimir Todos"
        const allPast = sups.every((s) => s.status !== "generar");
        setAllGenerated(allPast && sups.length > 0);

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


  // ── Derived: categories summary ──────────────────────────────────────────────

  /**
   * Builds the category summary rows shown in CategoriesTable.
   * Derived from orderItems so it always stays in sync without an extra API call.
   *
   * Each row: { category: string, productCount: number, assignedSuppliers: number }
   *
   * TODO: Replace `assignedSuppliers` with a per-category count once the backend
   *       provides that breakdown. Currently it counts all non-"generar" suppliers
   *       across the whole order, which is an approximation.
   */

  const categories = useMemo(() => {
    const map = {};
    orderItems.forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = { category: item.category, productCount: 0 };
      }
      map[item.category].productCount++;
    });
      
    return Object.values(map).map((cat) => ({
      ...cat,
      assignedSuppliers: suppliers.filter((s) => {
        if (s.status === "generar") return false;

        const itemIdsForCategory = orderItems
          .filter((item) => item.category === cat.category)
          .map((item) => item.id);

        // Guard: if no quotationItems, check the supplier's categories array instead
        if (!s.quotationItems || s.quotationItems.length === 0) {
          return s.categories?.some((c) => c === cat.category) ?? false;
        }

        return s.quotationItems.some((qi) =>
          itemIdsForCategory.includes(qi.orderItemId)
        );
      }).length,
    }));
  }, [orderItems, suppliers]);

  /**
   * Flat list of unique category name strings.
   * Passed to SupplierSearchModal and the service layer for backend filtering.
   */
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
   * Persists a supplier's filled-in quotation and advances its status.
   *
   * Optimistic update: UI updates immediately; backend call fires in background.
   * If the backend fails, the error is logged — add a toast + state revert here
   * once your notification system is in place.
   *
   * Status transitions:
   *   "generar"   → "pendiente"  (first time the quotation is sent)
   *   "pendiente" → "listo"      (supplier confirmed quantities and prices)
   *
   * @param {number} supplierId   - ID of the supplier being updated.
   * @param {Array}  updatedRows  - Quotation rows from the modal form.
   */
  const handleSaveQuotation = async (supplierId, updatedRows, isComplete) => {
    try {
      // TODO: Remove optimistic update if your backend is slow or unreliable.
      // Currently we update UI immediately and fire the API in background.
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== supplierId) return s;
          
          return {
            ...s,
            status: isComplete ? "reading" : "pending",
            quotationItems: updatedRows,
          };
        })
      );
      await saveQuotation(orderId, supplierId, updatedRows);
    } catch (err) {
      // TODO: Show error toast and revert optimistic update
      console.error("Error saving quotation:", err);
    }
  };


  // ── "Generar Todos" / "Imprimir Todos" ───────────────────────────────────────

  /**
   * Handles the main action button in SuppliersTable, which toggles between
   * "Generar Todos" and "Imprimir Todos" depending on `allGenerated`.
   *
   * When label is "Generar Todos":
   *   - Transitions all "generar" suppliers to "pendiente" (optimistic).
   *   - Calls generateAllQuotations() on the backend.
   *   - Sets allGenerated = true → button switches to "Imprimir Todos".
   *
   * When label is "Imprimir Todos":
   *   - Calls printAllQuotations() on the backend.
   *   - TODO: Handle the print URL/blob returned by the backend (open in new tab, etc.)
   */
  const handleGenerateOrPrintAll = async () => {
      if (!allGenerated) {
      // ── Generar Todos ──
      try {
        setSuppliers((prev) =>
          prev.map((s) => (s.status === "created" ? { ...s, status: "unsend" } : s))
        );
        await generateAllQuotations(orderId);
        setAllGenerated(true);
      } catch (err) {
        // TODO: Show error toast and revert supplier statuses
        console.error("Error generating all quotations:", err);
      }
    } else {
      // ── Imprimir Todos ──
      try {
        const result = await printAllQuotations(orderId);
        // TODO: Handle result — e.g. open result.printUrl in a new tab:
        // window.open(result.printUrl, "_blank");
        console.log("Print result:", result);
      } catch (err) {
        // TODO: Show error toast
        console.error("Error printing all quotations:", err);
      }
    }
  }

  // ── Supplier search modal handlers ───────────────────────────────────────────

  /** Opens the SupplierSearchModal. */
  const handleOpenSupplierSearch = () => setIsSupplierSearchOpen(true);

  /** Closes the SupplierSearchModal without adding anyone. */
  const handleCloseSupplierSearch = () => setIsSupplierSearchOpen(false);


  /**
   * Adds one or more suppliers selected in SupplierSearchModal to the order.
   *
   * The backend returns the newly created supplier entries; we append them
   * directly to local state to avoid a full re-fetch.
   *
   * Resets allGenerated to false because the new supplier(s) are in "generar"
   * status and haven't been notified yet, so "Generar Todos" becomes relevant again.
   *
   * @param {Array} selectedSuppliers - Supplier objects chosen in the modal.
   *   Each: { id: number, name: string, categories: string[] }
   */
  const handleAddSuppliers = async (selectedSuppliers) => {
    try {
      const ids = selectedSuppliers.map((s) => s.id);
      await addSuppliers(orderId, ids);

      const newSuppliers = selectedSuppliers.map((s) => ({
        id: s.id,
        name: s.name,
        // Newly added, not yet generated or printed.
        status: "created",
        quotationItems: [],
        categories: s.categories ?? [],
      }));

      setSuppliers((prev) => [...prev, ...newSuppliers]);

      setAllGenerated(false);
      setIsSupplierSearchOpen(false);
    } catch (err) {
      console.error("Error adding suppliers:", err);
    }
  };

  // ── Print handler ────────────────────────────────────────────────────────────

  /** Triggers browser print for the current quotation. */
  const handlePrint = () => window.print();

  const handlePrintQuotation = async (supplierId) => {
    try {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierId ? {...s, status: "pending"} : s))
      );

      // The modal prints using window.print(), so here we're only synchronizing the state.
      // If the backend then returns a PDF, this is the point to open it.
    } catch (err) {
      console.error("Error preparing print:", err);
    }
  };
  // ── Exposed API ──────────────────────────────────────────────────────────────

  return {
    // Remote data
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
    handlePrint: handlePrintQuotation,
    handlePrint,

    // Supplier search modal
    isSupplierSearchOpen,
    handleOpenSupplierSearch,
    handleCloseSupplierSearch,
    handleAddSuppliers,

    // SuppliersTable header button
    allGenerated,           // true → show "Imprimir Todos", false → show "Generar Todos"
    handleGenerateOrPrintAll,
  };
}
