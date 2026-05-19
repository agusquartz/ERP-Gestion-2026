/**
 * @file usePurchaseRequests.js
 * @module modules/purchases/purchase-requests/id/hooks
 *
 * @description
 * Centraliza el estado y la lógica de negocio de la vista de Purchase Requests.
 *
 * Responsibilities:
 * - Cargar el purchase request completo.
 * - Derivar items, categorías y proveedores/cotizaciones.
 * - Abrir/cerrar modal de cotización.
 * - Abrir/cerrar modal de búsqueda de proveedores.
 * - Generar cotizaciones nuevas (POST).
 * - Guardar cambios de cotización (PATCH).
 * - Imprimir una cotización o todas.
 * - Mantener soporte para estados:
 *   CREATED(1) -> proveedor agregado pero sin cotización aún
 *   UNSENT(2)  -> cotización generada pero todavía no enviada
 *   PENDING(3)  -> enviada / en proceso
 *   OK(4)       -> completa
 *   CANCELLED(5)-> cancelada
 */

"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getPurchaseRequest,
  createPurchaseQuote,
  patchPurchaseQuote,
} from "@/lib/http/client/purchase-request";

import { getSuppliers } from "@/lib/http/client/supplier";

// ─────────────────────────────────────────────────────────────────────────────
// Status IDs
// ─────────────────────────────────────────────────────────────────────────────
//
// 1 = created   -> local only, no quote generated yet
// 2 = unsent    -> quote generated, not sent yet
// 3 = pending   -> sent, still incomplete
// 4 = ok        -> complete
// 5 = cancelled -> no items active
//
export const STATUS = {
  CREATED: 1,
  UNSENT: 2,
  PENDING: 3,
  OK: 4,
  CANCELLED: 5,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isFinalStatus(statusId) {
  return statusId === STATUS.OK || statusId === STATUS.CANCELLED;
}

function normalizeCategoryNames(categories = []) {
  return categories
    .map((cat) => {
      if (typeof cat === "string") return cat;
      return cat?.name ?? cat?.category ?? cat?.label ?? "";
    })
    .filter(Boolean);
}

function isSupplierInCategory(itemCategoryName, supplierCategories = []) {
  const normalized = normalizeCategoryNames(supplierCategories);
  return normalized.includes(itemCategoryName);
}

function buildRowsForSupplier(orderItems = [], supplier = {}) {
  const supplierCategories = normalizeCategoryNames(supplier.categories);

  const itemsForSupplier =
    supplierCategories.length > 0
      ? orderItems.filter((item) =>
          isSupplierInCategory(item.category, supplierCategories)
        )
      : orderItems;

  return itemsForSupplier.map((item) => {
    const existing = supplier.quotationItems?.find(
      (qi) => qi.productId === item.productId
    );

    return {
      orderItemId: item.id,
      productId: item.productId,
      confirmedQty: existing?.confirmedQty ?? 0,
      unitPrice: existing?.unitPrice ?? 0,
      // true = descartado / desmarcado en el UI
      excluded: existing?.excluded ?? false,
    };
  });
}

function buildCategoriesFromQuoteDetails(quoteDetails = [], orderItems = []) {
  const productIds = quoteDetails.map((d) => d.productId);
  const categoryNames = orderItems
    .filter((item) => productIds.includes(item.productId))
    .map((item) => item.category);

  return [...new Set(categoryNames)];
}

function shouldBeOk(rows = []) {
  const activeRows = rows.filter((row) => !row.excluded);

  if (activeRows.length === 0) return false;

  return activeRows.every(
    (row) =>
      Number(row.confirmedQty) > 0 && Number(row.unitPrice) > 0
  );
}

function buildNextStatus(currentStatus, rows = []) {
  const activeRows = rows.filter((row) => !row.excluded);

  if (activeRows.length === 0) {
    return STATUS.CANCELLED;
  }

  if (currentStatus === STATUS.UNSENT) {
    return shouldBeOk(rows) ? STATUS.PENDING : STATUS.UNSENT;
  }

  if (currentStatus === STATUS.PENDING) {
    return shouldBeOk(rows) ? STATUS.OK : STATUS.PENDING;
  }

  return currentStatus;
}

function mapLoadedQuoteToSupplier(quote, orderItems = []) {
  return {
    id: quote.id, // quote id
    supplierId: quote.supplier.id,
    name: quote.supplier.name,
    stamp: quote.supplier.stamp ?? "",
    statusId: quote.status.id,
    statusName: quote.status.name,
    createdAt: quote.createdAt,
    dateSent: quote.dateSent,
    dateReceived: quote.dateReceived,
    categories: buildCategoriesFromQuoteDetails(quote.details ?? [], orderItems),
    quotationItems: (quote.details ?? []).map((detail) => ({
      productId: detail.productId,
      confirmedQty: detail.confirmedQuantity,
      unitPrice: detail.unitCost,
      // OJO:
      // backend: enabled=true cuando el item fue marcado/descartado según tu flujo
      excluded: Boolean(detail.enabled),
    })),
  };
}

function mapGeneratedQuoteToSupplier(quote, supplier, orderItems = []) {
  return {
    id: quote.id, // quote id
    supplierId: supplier.supplierId,
    name: supplier.name,
    stamp: supplier.stamp ?? "",
    statusId: quote.status.id,
    statusName: quote.status.name,
    createdAt: quote.createdAt,
    dateSent: quote.dateSent ?? null,
    dateReceived: quote.dateReceived ?? null,
    categories: normalizeCategoryNames(supplier.categories),
    quotationItems: buildRowsForSupplier(orderItems, supplier),
  };
}

function mapSelectedSupplierToLocalRow(supplier) {
  return {
    id: null, // todavía no hay quote
    supplierId: supplier.id,
    name: supplier.name,
    stamp: supplier.stamp ?? "",
    statusId: STATUS.CREATED,
    statusName: "",
    createdAt: null,
    dateSent: null,
    dateReceived: null,
    categories: normalizeCategoryNames(supplier.categories),
    quotationItems: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export default function usePurchaseRequests(id) {
  // ── Remote data ────────────────────────────────────────────────────────────
  const [purchaseRequest, setPurchaseRequest] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [activeSupplier, setActiveSupplier] = useState(null);
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        const data = await getPurchaseRequest(id);
        console.log("PURCHASE REQUEST RESPONSE");
        console.log(data);

        setPurchaseRequest({
          id: data.id,
          createdAt: data.createdAt,
          requester: `${data.employee?.name ?? ""} ${data.employee?.surname ?? ""}`.trim(),
        });

        const mappedItems = (data.details ?? []).map((detail, index) => ({
          id: detail.id ?? index + 1,
          productId: detail.product.id,
          code: detail.product.code,
          product: detail.product.description,
          category: detail.product.category.name,
          categoryId: detail.product.category.id,
          quantity: detail.quantity,
        }));

        setOrderItems(mappedItems);

        const mappedSuppliers = (data.quotes ?? []).map((quote) =>
          mapLoadedQuoteToSupplier(quote, mappedItems)
        );

        setSuppliers(mappedSuppliers);
      } catch (err) {
  console.error("ERROR fetchAll:", err);
  console.error("DETAIL:", err?.response?.data ?? err?.message ?? err);
  setError(err?.response?.data ?? err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [id]);

  // ── Derived: categories summary ────────────────────────────────────────────
  const categories = useMemo(() => {
    const map = {};

    orderItems.forEach((item) => {
      if (!map[item.categoryId]) {
        map[item.categoryId] = {
          id: item.categoryId,
          name: item.category,
          productCount: 0,
          assignedSuppliers: 0,
        };
      }

      map[item.categoryId].productCount += 1;
    });

    return Object.values(map).map((cat) => ({
      category: cat.name,
      categoryId: cat.id,
      productCount: cat.productCount,
      assignedSuppliers: suppliers.filter((supplier) => {
        // Si aún no fue generado, no cuenta.
        if (supplier.statusId === STATUS.CREATED) return false;

        const supplierCategoryNames = normalizeCategoryNames(supplier.categories);

        if (supplierCategoryNames.length === 0) {
          return false;
        }

        return supplierCategoryNames.includes(cat.name);
      }).length,
    }));
  }, [orderItems, suppliers]);

  const categoryNames = useMemo(
    () => [...new Set(orderItems.map((i) => i.category))],
    [orderItems]
  );

  const categoryIds = useMemo(
    () => [...new Set(orderItems.map((i) => i.categoryId))],
    [orderItems]
  );

  // ── Derived: all generated / printable ────────────────────────────────────
  const allGenerated = useMemo(() => {
    const active = suppliers.filter((s) => s.statusId !== STATUS.CANCELLED);
    return active.length > 0 && active.every((s) => s.statusId !== STATUS.CREATED);
  }, [suppliers]);

  const hasPrintableSuppliers = useMemo(() => {
    return suppliers.some(
      (s) => s.statusId === STATUS.UNSENT || s.statusId === STATUS.PENDING
    );
  }, [suppliers]);

  // ── Quotation modal handlers ───────────────────────────────────────────────
  const handleOpenQuotation = async (supplier) => {
    if (!supplier) return;

    // Si todavía no tiene quote, lo generamos primero y luego abrimos modal.
    if (supplier.statusId === STATUS.CREATED || supplier.id == null) {
      await handleGenerateQuotation(supplier);
      return;
    }

    setActiveSupplier(supplier);
  };

  const handleCloseQuotation = () => setActiveSupplier(null);

  /**
   * Genera una cotización nueva para un proveedor que todavía no tiene quote.
   * Hace POST y deja el estado en UNSENT.
   */
  const handleGenerateQuotation = async (supplier) => {
    try {
      if (!supplier) return;

      // Si ya existe la cotización, solo abrir.
      if (supplier.id != null && supplier.statusId !== STATUS.CREATED) {
        setActiveSupplier(supplier);
        return;
      }

      const payload = {
        purchaseRequestId: Number(id),
        supplierId: supplier.supplierId,
        createdAt: todayISO(),
        details: orderItems
          .filter((item) =>
            isSupplierInCategory(item.category, supplier.categories)
          )
          .map((item) => ({
            productId: item.productId,
          })),
      };

      const created = await createPurchaseQuote(id, payload);

      const mappedSupplier = mapGeneratedQuoteToSupplier(
        created,
        supplier,
        orderItems
      );

      setSuppliers((prev) =>
        prev.map((row) =>
          row.supplierId === supplier.supplierId ? mappedSupplier : row
        )
      );

      setActiveSupplier(mappedSupplier);
    } catch (err) {
        console.error("ERROR generate quotation:", err);
  console.error("DETAIL:", err?.response?.data ?? err?.message ?? err);
    }
  };

  /**
   * Guarda la cotización actual.
   * - Si faltan datos y el estado era UNSENT => sigue UNSENT.
   * - Si pasa a completa y estaba UNSENT => PENDING y envía dateSent.
   * - Si pasa a completa y estaba PENDING => OK y envía dateReceived.
   * - Si no hay items activos => CANCELLED.
   */
  const handleSaveQuotation = async (quoteId, rows, _isComplete) => {
    try {
      const currentSupplier = suppliers.find((s) => s.id === quoteId);
      if (!currentSupplier) return;

      if (isFinalStatus(currentSupplier.statusId)) {
        return;
      }

      const currentStatus = currentSupplier.statusId;
      const nextStatus = buildNextStatus(currentStatus, rows);

      const payload = {
        quoteId,
        statusId: nextStatus,
        ...(currentStatus === STATUS.UNSENT &&
          nextStatus === STATUS.PENDING && {
            dateSent: currentSupplier.dateSent || todayISO(),
          }),
        ...(currentStatus === STATUS.PENDING &&
          nextStatus === STATUS.OK && {
            dateReceived: currentSupplier.dateReceived || todayISO(),
          }),
        details: rows.map((row) => ({
          productId: row.productId,
          confirmedQuantity: Number(row.confirmedQty),
          unitCost: Number(row.unitPrice),
          // Backend: el checkbox "desmarcado" se envía como true según tu flujo.
          enabled: Boolean(row.excluded),
        })),
      };

      await patchPurchaseQuote(id, payload);

      const updatedSupplier = {
        ...currentSupplier,
        statusId: nextStatus,
        dateSent: payload.dateSent ?? currentSupplier.dateSent ?? null,
        dateReceived: payload.dateReceived ?? currentSupplier.dateReceived ?? null,
        quotationItems: rows,
      };

      setSuppliers((prev) =>
        prev.map((row) => (row.id === quoteId ? updatedSupplier : row))
      );

      setActiveSupplier(updatedSupplier);
    } catch (err) {
        console.error("ERROR save quotation:", err);
  console.error("DETAIL:", err?.response?.data ?? err?.message ?? err);
    }
  };

  /**
   * Imprime una cotización individual.
   * Si todavía está UNSENT, la pasa a PENDING y envía dateSent.
   */
  const handlePrint = async (quoteId) => {
    try {
      const supplier = suppliers.find((s) => s.id === quoteId);
      if (!supplier) return;

      if (supplier.statusId === STATUS.CREATED) {
        return;
      }

      if (supplier.statusId === STATUS.UNSENT) {
        const payload = {
          quoteId,
          statusId: STATUS.PENDING,
          dateSent: supplier.dateSent || todayISO(),
        };

        await patchPurchaseQuote(id, payload);

        setSuppliers((prev) =>
          prev.map((row) =>
            row.id === quoteId
              ? {
                  ...row,
                  statusId: STATUS.PENDING,
                  dateSent: payload.dateSent,
                }
              : row
          )
        );
      }

      window.print();
    } catch (err) {
        console.error("ERROR save quotation:", err);
  console.error("DETAIL:", err?.response?.data ?? err?.message ?? err);
    }
  };

  /**
   * Genera o imprime en bloque según corresponda:
   * - Si hay proveedores sin quote => genera todos.
   * - Si todos ya tienen quote => imprime todos los UNSENT/PENDING.
   */
  const handleGenerateOrPrintAll = async () => {
    if (!allGenerated) {
      await handleGenerateAll();
      return;
    }

    await handlePrintAll();
  };

  /**
   * Genera todas las cotizaciones pendientes de crear (CREATED -> UNSENT).
   */
  const handleGenerateAll = async () => {
    try {
      const toGenerate = suppliers.filter((s) => s.statusId === STATUS.CREATED);

      if (toGenerate.length === 0) return;

      const createdQuotes = await Promise.all(
        toGenerate.map(async (supplier) => {
          const payload = {
            purchaseRequestId: Number(id),
            supplierId: supplier.supplierId,
            createdAt: todayISO(),
            details: orderItems
              .filter((item) =>
                isSupplierInCategory(item.category, supplier.categories)
              )
              .map((item) => ({
                productId: item.productId,
              })),
          };

          const created = await createPurchaseQuote(id, payload);
          return { supplier, created };
        })
      );

      const mappedUpdates = createdQuotes.map(({ supplier, created }) =>
        mapGeneratedQuoteToSupplier(created, supplier, orderItems)
      );

      setSuppliers((prev) =>
        prev.map((row) => {
          const updated = mappedUpdates.find(
            (u) => u.supplierId === row.supplierId
          );
          return updated ? updated : row;
        })
      );
    } catch (err) {
        console.error("ERROR generate all:", err);
  console.error("DETAIL:", err?.response?.data ?? err?.message ?? err);
    }
  };

  /**
   * Imprime todas las cotizaciones que estén UNSENT o PENDING.
   * No incluye OK ni CANCELLED.
   * Si una está UNSENT, primero la mueve a PENDING y envía dateSent.
   */
  const handlePrintAll = async () => {
    try {
      const printableSuppliers = suppliers.filter(
        (s) => s.statusId === STATUS.UNSENT || s.statusId === STATUS.PENDING
      );

      if (printableSuppliers.length === 0) return;

      const toPatch = printableSuppliers.filter(
        (s) => s.statusId === STATUS.UNSENT
      );

      await Promise.all(
        toPatch.map((supplier) =>
          patchPurchaseQuote(id, {
            quoteId: supplier.id,
            statusId: STATUS.PENDING,
            dateSent: supplier.dateSent || todayISO(),
          })
        )
      );

      if (toPatch.length > 0) {
        setSuppliers((prev) =>
          prev.map((row) =>
            row.statusId === STATUS.UNSENT
              ? {
                  ...row,
                  statusId: STATUS.PENDING,
                  dateSent: row.dateSent || todayISO(),
                }
              : row
          )
        );
      }

      window.print();
    } catch (err) {
        console.error("ERROR print all:", err);
  console.error("DETAIL:", err?.response?.data ?? err?.message ?? err);
    }
  };

  // ── Supplier search modal handlers ─────────────────────────────────────────
  const handleOpenSupplierSearch = () => setIsSupplierSearchOpen(true);
  const handleCloseSupplierSearch = () => setIsSupplierSearchOpen(false);

  /**
   * Busca proveedores disponibles filtrando por texto y categorías del pedido.
   * Excluye los proveedores ya agregados a esta vista.
   */
  const searchAvailableSuppliers = async ({
    contains = "",
    categories = categoryIds,
  } = {}) => {
    try {
      const result = await getSuppliers({
        contains,
        categories,
      });

      const existingIds = suppliers.map((s) => s.supplierId);

      return (result ?? []).filter((supplier) => !existingIds.includes(supplier.id));
    } catch (err) {
      console.error("Error searching suppliers:", err);
      return [];
    }
  };

  /**
   * Agrega al estado local los proveedores seleccionados desde el modal.
   * Todavía no crea cotización; eso ocurre al presionar "Generar".
   */
  const handleAddSuppliers = async (selectedSuppliers) => {
    try {
      const normalized = (selectedSuppliers ?? [])
        .map(mapSelectedSupplierToLocalRow)
        .filter((row) => row.supplierId != null);

      if (normalized.length === 0) return;

      setSuppliers((prev) => {
        const existingIds = new Set(prev.map((s) => s.supplierId));
        const newRows = normalized.filter((row) => !existingIds.has(row.supplierId));
        return [...prev, ...newRows];
      });

      setIsSupplierSearchOpen(false);
    } catch (err) {
      console.error("Error adding suppliers:", err);
    }
  };

  // ── Exposed API ───────────────────────────────────────────────────────────
  return {
    // Remote data
    purchaseRequest,
    orderItems,
    suppliers,
    categories,
    categoryNames,
    categoryIds,
    loading,
    error,

    // Quotation modal
    activeSupplier,
    handleOpenQuotation,
    handleCloseQuotation,
    handleGenerateQuotation,
    handleSaveQuotation,
    handlePrint,

    // Supplier search modal
    isSupplierSearchOpen,
    handleOpenSupplierSearch,
    handleCloseSupplierSearch,
    searchAvailableSuppliers,
    handleAddSuppliers,

    // Bulk action button
    allGenerated,
    hasPrintableSuppliers,
    handleGenerateAll,
    handlePrintAll,
    handleGenerateOrPrintAll,

    // Helpers
    isFinalStatus,
    setActiveSupplier,
  };
}

// Compatibilidad con imports anteriores
export const usePurchaseOrder = usePurchaseRequests;