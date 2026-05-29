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
import { printQuotes } from "../utils/printQuotes";

import {
  getPurchaseRequestById,
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

  // Todos descartados → CANCELLED
  if (activeRows.length === 0) {
    return STATUS.CANCELLED;
  }

  const complete = shouldBeOk(rows);

  if (currentStatus === STATUS.UNSENT) {
    // UNSENT → OK si todos completos, UNSENT → PENDING si incompletos
    // (UNSENT → UNSENT no es transición válida en el backend)
    return complete ? STATUS.OK : STATUS.PENDING;
  }

  if (currentStatus === STATUS.PENDING) {
    return complete ? STATUS.OK : STATUS.PENDING;
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
    quotationItems: (quote.details ?? []).map((detail) => {
      const orderItem = orderItems.find((i) => i.productId === detail.productId);
      return {
        orderItemId: detail.productId,
        productId: detail.productId,
        code: orderItem?.code ?? "",
        product: orderItem?.product ?? String(detail.productId),
        category: orderItem?.category ?? "",
        requestedQty: orderItem?.quantity ?? 0,
        confirmedQty: detail.confirmedQuantity ?? 0,
        unitPrice: Number(detail.unitCost) ?? 0,
        excluded: !detail.enabled,
      };
    }),
  };
}

function mapGeneratedQuoteToSupplier(response, supplier, orderItems = []) {
  // El backend devuelve el purchase request completo con un array `quotes`.
  // Buscamos la quote que corresponde a este proveedor por supplierId.
  const quote = Array.isArray(response.quotes)
    ? response.quotes.find((q) => q.supplier?.id === supplier.supplierId)
    : response; // fallback: si algún día el backend devuelve la quote directamente

  if (!quote) {
    console.error("[mapGeneratedQuoteToSupplier] no se encontró quote para supplierId:", supplier.supplierId);
    return null;
  }

  return {
    id: quote.id,
    supplierId: supplier.supplierId,
    name: supplier.name,
    stamp: supplier.stamp ?? quote.supplier?.stamp ?? "",
    statusId: quote.status?.id ?? STATUS.UNSENT,
    statusName: quote.status?.name ?? "",
    createdAt: quote.createdAt,
    dateSent: quote.dateSent ?? null,
    dateReceived: quote.dateReceived ?? null,
    categories: normalizeCategoryNames(supplier.categories),
    // Cruzamos details de la quote con orderItems para tener nombre y cantidad solicitada
    quotationItems: (quote.details ?? []).map((detail) => {
      const orderItem = orderItems.find((i) => i.productId === detail.productId);
      return {
        orderItemId: detail.productId,
        productId: detail.productId,
        code: orderItem?.code ?? "",
        product: orderItem?.product ?? String(detail.productId),
        category: orderItem?.category ?? "",
        requestedQty: orderItem?.quantity ?? 0,
        confirmedQty: detail.confirmedQuantity ?? 0,
        unitPrice: Number(detail.unitCost) ?? 0,
        excluded: !detail.enabled,
      };
    }),
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

        const data = await getPurchaseRequestById(id);

        setPurchaseRequest({
          id: data.id,
          createdAt: data.createdAt,
          requester: `${data.employee?.name ?? ""} ${data.employee?.surname ?? ""}`.trim(),
        });

        const mappedItems = (data.details ?? []).map((detail) => ({
          id: detail.product.id,          // usar productId como clave estable
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
      id: cat.id,
      name: cat.name,                // CategoriesTable usa category.name
      category: cat.name,            // compatibilidad con variantes antiguas
      categoryId: cat.id,
      productCount: cat.productCount,
      items: Array(cat.productCount).fill(null), // CategoriesTable usa category.items.length
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
      (s) =>
        s.statusId === STATUS.CREATED ||
        s.statusId === STATUS.UNSENT ||
        s.statusId === STATUS.PENDING
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

      if (!mappedSupplier) return; // quote no encontrada en la respuesta

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

      // dateSent: siempre que haya al menos un item activo, mandamos fecha de hoy (o la que ya tenía)
      // dateReceived: solo cuando todos los items activos están completos (nextStatus === OK)
      const activeRows = rows.filter((r) => !r.excluded);
      const allComplete =
        activeRows.length > 0 &&
        activeRows.every((r) => Number(r.confirmedQty) > 0 && Number(r.unitPrice) > 0);

      const dateSent = activeRows.length > 0
        ? currentSupplier.dateSent || todayISO()
        : null;

      const dateReceived = allComplete
        ? currentSupplier.dateReceived || todayISO()
        : currentSupplier.dateReceived ?? null;

      const payload = {
        quoteId: Number(quoteId),
        statusId: Number(nextStatus),
        dateSent,
        dateReceived,
        details: rows.map((row) => ({
          productId: Number(row.productId),
          confirmedQuantity: Math.round(Number(row.confirmedQty)),
          unitCost: Number(Number(row.unitPrice).toFixed(2)),
          // Forzamos boolean explícito — row.excluded puede ser truthy no-boolean
          enabled: row.excluded === true ? false : true,
        })),
      };

      console.log("[PATCH payload details]", JSON.stringify(payload.details, null, 2));

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
          quoteId: Number(quoteId),
          statusId: STATUS.PENDING,
          dateSent: supplier.dateSent || todayISO(),
          dateReceived: supplier.dateReceived ?? null,
          details: null,
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

      printQuotes({
        purchaseRequest,
        suppliers: [supplier],
        orderItems,
      });
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

      const mappedUpdates = createdQuotes
        .map(({ supplier, created }) =>
          mapGeneratedQuoteToSupplier(created, supplier, orderItems)
        )
        .filter(Boolean); // descartar nulls si alguna quote no se encontró

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
            quoteId: Number(supplier.id),
            statusId: STATUS.PENDING,
            dateSent: supplier.dateSent || todayISO(),
            dateReceived: supplier.dateReceived ?? null,
            details: null,
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

      // Imprimir: CREATED, UNSENT y PENDING — excluir OK y CANCELLED
      const toPrint = suppliers.filter(
        (s) =>
          s.statusId === STATUS.CREATED ||
          s.statusId === STATUS.UNSENT ||
          s.statusId === STATUS.PENDING
      );

      printQuotes({
        purchaseRequest,
        suppliers: toPrint,
        orderItems,
      });
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
      // El backend usa AND para categories — necesitamos OR.
      // Hacemos una búsqueda por cada categoría y deduplicamos por supplier.id.
      const searches = categories.length > 0
        ? await Promise.all(
            categories.map((catId) =>
              getSuppliers({ contains, categories: [catId] })
            )
          )
        : [await getSuppliers({ contains, categories: [] })];

      // Aplanar y deduplicar por id
      const seen = new Set();
      const result = searches
        .flat()
        .filter((supplier) => {
          if (seen.has(supplier.id)) return false;
          seen.add(supplier.id);
          return true;
        });

      const existingIds = new Set(suppliers.map((s) => s.supplierId));
      return result.filter((supplier) => !existingIds.has(supplier.id));
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