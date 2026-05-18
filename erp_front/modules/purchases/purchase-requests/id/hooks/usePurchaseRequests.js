/**
 * @file usePurchaseRequests.js
 * @module modules/purchases/purchase-requests/id/hooks
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
  saveQuotation,
  printAllQuotations,
  addSuppliers,
  updateQuotationStatus,
} from "../services/purchaseRequestsService";


// ─── Status IDs — must match the `statuses` table in the DB ──────────────────
//
//  id | status
//  ---+---------
//   1 | created   ← supplier just added, no action yet
//   2 | unsent    ← "Generar" clicked, quote sent but no response yet
//   3 | pending   ← saved with incomplete fields
//   4 | reading   ← all fields filled and saved (read-only)
//
// Exported so SuppliersTable can import and use them directly
// without duplicating magic numbers.
export const STATUS = {
  CREATED:   1,
  UNSENT:    2,
  PENDING:   3,
  READY:     4,
  CANCELLED: 5,
};

export function usePurchaseOrder(orderId) {
  // ── Remote data ─────────────────────────────────────────────────────────────
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
   * Derived from suppliers — no manual state needed.
   * true  → all active (non-cancelled) suppliers are past CREATED → show "Imprimir Todos"
   * false → at least one active supplier is still in CREATED      → show "Generar Todos"
   *
   * Recalculates automatically whenever suppliers changes, so adding a new supplier
   * or saving a quotation always reflects the correct label without extra setAllGenerated calls.
   */
  const allGenerated = useMemo(() => {
    const active = suppliers.filter((s) => s.statusId !== STATUS.CANCELLED);
    return active.length > 0 && active.every((s) => s.statusId !== STATUS.CREATED);
  }, [suppliers]);


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
        const order = await getPurchaseOrder(orderId);
        
        setPurchaseOrder({
            id:         order.id,
            createdAt:  order.created_at,
            requester:  order.employee_name,
        });
        
        // Map items to fronted shape
        setOrderItems(
          (order.items ?? []).map((item) => ({
            id:         item.id,
            productId:  item.product_id,
            code:       item.product_code,
            product:    item.product_name,
            category:   item.category,
            quantity:   item.quantity,
          }))
        );

         // Mapear quotes → suppliers al formato del front
         // quotationItems preserves excluded state when re-opening the modal
        const mappedSuppliers = (order.quotes ?? []).map((q) => ({
          id:           q.id,                  // quote_id - used for PATCH and POST /details
          supplierId:   q.supplier_id,
          name:         q.supplier_name,
          statusId:     q.status_id, // "unsent" → "generar", etc.
          categories:   q.categories,
          quotationItems: (q.details ?? []).map((d) => ({
            productId:      d.product_id,
            confirmedQty:   d.confirmed_quantity,
            unitPrice:      d.unit_cost,
            excluded: false,
          })),
        }));
        
        setSuppliers(mappedSuppliers);
        


      } catch (err) {
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
      // Count suppliers tht are past "created" and handle this category
      assignedSuppliers: suppliers.filter((s) => {
        if (s.statusId === STATUS.CREATED) return false;
        
        if (!s.quotationItems || s.quotationItems.length === 0) {
          return s.categories?.some((c) => c === cat.category) ?? false;
        }
        
        const itemIdsForCategory = orderItems
          .filter((item) => item.category === cat.category)
          .map((item) => item.productId);

        return s.quotationItems.some(
        (qi) =>  !qi.excluded && itemIdsForCategory.includes(qi.productId)
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
  /**
  * Opens QuotationModal for a supplier
  * If status is CREATED, transitions to UNSENT first (marks quote as "generated")
  */
  
  const handleOpenQuotation = async (supplier) => {
    if (supplier.statusId === STATUS.CREATED) {
      try {
        await updateQuotationStatus(supplier.id, STATUS.UNSENT);
        const updated = { ...supplier, statusId: STATUS.UNSENT};
        setSuppliers((prev) =>
          prev.map((s) => (s.id === supplier.id ? updated : s))
        );
        setActiveSupplier(updated);
      } catch (err) {
        console.error("Error transition to unsent:", err);
        // Open anyway with original status so the user isn't blocked
        setActiveSupplier(supplier);
      }
    } else {
      setActiveSupplier(supplier);
    }
  };
  
  /** Closes QuotationModal without saving. */
  const handleCloseQuotation = () => setActiveSupplier(null);
  
  /**
   * Saves a supplier's quotation.
   *
   * allRows includes BOTH active and excluded rows so that:
   *   - Excluded checkboxes persist when re-opening the modal
   *   - Partially filled values persist when re-opening the modal
   *
   * Only activeRows (non-excluded) are sent to the backend.
   *
   * Status transitions:
   *   UNSENT  → PENDING  if any active row is missing qty or price
   *   UNSENT  → READY    if all active rows are fully filled
   *   PENDING → READY    if remaining fields are now complete
   *
   * @param {number}  quoteId    - The quote (supplier row) being saved
   * @param {Array}   allRows    - All rows including excluded ones (for UI persistence)
   * @param {boolean} isComplete - True if all active rows have qty > 0 and price > 0
   */
  const handleSaveQuotation = async (quoteId, allRows, isComplete) => {
    try {
      // Only send non-excluded rows to the backend
      const activeRows = allRows.filter((r) => !r.excluded);
    
      if (activeRows.length === 0) {
        await updateQuotationStatus(quoteId, STATUS.CANCELLED);
        
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === quoteId
              ? {
                ...s,
                statusId: STATUS.CANCELLED,
                quotationItems: allRows,
              }
              : s
          )
        );
        return;
      }

      const supplier        = suppliers.find((s) => s.id === quoteId);
      const currentStatus   = supplier?.statusId;

      let nextStatus = isComplete ? STATUS.READY : STATUS.PENDING;

      await saveQuotation(quoteId, activeRows, isComplete, currentStatus);

      // Optimistic update - update UI inmediately
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === quoteId
            ? {
                ...s,
                statusId: nextStatus,
                // Store ALL rows so excluded state and partial values persist
                quotationItems: allRows,
              }
            : s
        )
      );

      // Persist to backend
      await saveQuotation(quoteId, activeRows, isComplete, currentStatus);

    } catch (err) {
      console.error("Error saving quotation:", err);
    }
  };
  

  const handleGenerateQuotation = async (supplier) => {
    try {
      if (supplier.statusId === STATUS.CREATED) {
        await updateQuotationStatus(supplier.id, STATUS.UNSENT);

        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === supplier.id ? { ...s, statusId: STATUS.UNSENT } : s
          )
        );
      }

      setActiveSupplier(supplier);
    } catch (err) {
      console.error("Error generating quotation:", err);
    }
  };

  
  // ── "Imprimir" inside QuotationModal ───────────────────────────────────────────────────────
  const handlePrintQuotation = async (quoteId) => {
    try {
      const supplier = suppliers.find((s) => s.id === quoteId);
      if (!supplier) return;


      // Only update if currently UNSENT
      if (supplier.statusId === STATUS.UNSENT) {
        await updateQuotationStatus(quoteId, STATUS.PENDING);
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === quoteId ? { ...s, statusId: STATUS.PENDING } : s
          )
        );
      }
      window.print();
    } catch (err) {
      console.error("Error preparing print:", err);
    }
  };

  // ── "Generar Todos" / "Imprimir Todos" ───────────────────────────────────────
  /**
   * "Generar Todos": transitions all UNSENT suppliers to PENDING.
   * "Imprimir Todos": prints all quotations.
   *
   * Button is disabled when there are no suppliers (handled in SuppliersTable).
   */
  const handleGenerateOrPrintAll = async () => {
    if (!allGenerated) {
      try {
        // Find all providers in CREATED that have not yet been generated
        const toGenerate = suppliers.filter((s) => s.statusId === STATUS.CREATED);

        // Transicionar cada uno a UNSENT en el backend
        await Promise.all(
          toGenerate.map((s) => updateQuotationStatus(s.id, STATUS.UNSENT))
        );

        // Update local status
        setSuppliers((prev) =>
          prev.map((s) =>
            s.statusId === STATUS.CREATED ? { ...s, statusId: STATUS.UNSENT } : s
          )
        );
      } catch (err) {
        console.error("Error generating all quotations:", err);
      }
    } else {
      try {
          const printableSuppliers = suppliers.filter(
            (s) =>
              s.statusId === STATUS.UNSENT ||
              s.statusId === STATUS.PENDING
          );

          if (printableSuppliers.length === 0) {
            console.warn("No hay proveedores para imprimir");
            return;
          }

          console.log("Imprimiendo proveedores:", printableSuppliers);

          // si tu impresión es global:
          window.print();

        } catch (err) {
          console.error("Error printing all quotations:", err);
        }
    }
  }

  // ── Supplier search modal handlers ───────────────────────────────────────────

  const handleOpenSupplierSearch = () => setIsSupplierSearchOpen(true);
  const handleCloseSupplierSearch = () => setIsSupplierSearchOpen(false);

  /**
   * Adds selected suppliers to the order.
   * Uses the backend response directly so quote IDs are correct.
   * Resets allGenerated because new suppliers start as CREATED.
   */
  const handleAddSuppliers = async (selectedSuppliers) => {
    try {
      const ids =           selectedSuppliers.map((s) => s.id);
      const newSuppliers =  await addSuppliers(orderId, ids);
      setSuppliers((prev) => [...prev, ...newSuppliers]);
      setIsSupplierSearchOpen(false);
    } catch (err) {
      console.error("Error adding suppliers:", err);
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
    handleGenerateQuotation,

    // Supplier search modal
    isSupplierSearchOpen,
    handleOpenSupplierSearch,
    handleCloseSupplierSearch,
    handleAddSuppliers,

    // SuppliersTable header button
    allGenerated,           
    handleGenerateOrPrintAll,
  };
}