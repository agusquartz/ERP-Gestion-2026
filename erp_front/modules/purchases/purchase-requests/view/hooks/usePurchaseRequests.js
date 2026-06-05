/**
 * ----------------------------------------------------------------------------
 * @file usePurchaseRequests.js
 * @module modules/purchases/purchase-requests/id/hooks
 * ----------------------------------------------------------------------------
 *
 * Main business logic hook for the Purchase Requests view.
 *
 * This hook centralizes the logic needed to:
 * - Load the complete purchase request from the backend.
 * - Normalize and store request items.
 * - Manage suppliers and quotations.
 * - Open/close quotation and supplier search modals.
 * - Generate quotations.
 * - Update quotation data.
 * - Print one quotation or all of them.
 * - Derive summary data such as categories and supplier status.
 *
 * Supported quotation statuses:
 * ----------------------------------------------------------------------------
 * CREATED(1)
 * Supplier was added locally, but no quotation exists yet.
 *
 * UNSENT(2)
 * Quotation was generated, but not sent yet.
 *
 * PENDING(3)
 * Quotation was sent and is still incomplete.
 *
 * OK(4)
 * Quotation is complete.
 *
 * CANCELLED(5)
 * All active items were removed or the quotation is no longer valid.
 * ----------------------------------------------------------------------------
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
// These values are used throughout the hook to control:
// - UI labels
// - quotation transitions
// - patch payloads
// - print behavior
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

/**
 * Returns today's date in ISO format: YYYY-MM-DD.
 *
 * This is used when creating or updating quotation dates.
 *
 * @returns {string}
 */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Checks whether a status is considered final.
 *
 * Final statuses cannot be edited anymore.
 *
 * @param {number} statusId
 * @returns {boolean}
 */
function isFinalStatus(statusId) {
  return statusId === STATUS.OK || statusId === STATUS.CANCELLED;
}

/**
 * Converts category data into a plain array of strings.
 *
 * The backend may return categories in different formats:
 * - string
 * - { name }
 * - { category }
 * - { label }
 *
 * This helper normalizes all those shapes into a simple string array.
 *
 * @param {Array} categories
 * @returns {string[]}
 */
function normalizeCategoryNames(categories = []) {
  return categories
    .map((cat) => {
      if (typeof cat === "string") return cat;
      return cat?.name ?? cat?.category ?? cat?.label ?? "";
    })
    .filter(Boolean);
}

/**
 * Determines if a supplier belongs to a given item category.
 *
 * Used to decide which request items should be included in a quotation
 * for a specific supplier.
 *
 * @param {string} itemCategoryName
 * @param {Array} supplierCategories
 * @returns {boolean}
 */
function isSupplierInCategory(itemCategoryName, supplierCategories = []) {
  const normalized = normalizeCategoryNames(supplierCategories);
  return normalized.includes(itemCategoryName);
}

/**
 * Builds quotation rows for a supplier using the purchase request items.
 *
 * If the supplier already has quotation data, the existing values are reused.
 * Otherwise, default values are created for editing in the UI.
 *
 * Return shape:
 * [
 *   {
 *     orderItemId,
 *     productId,
 *     confirmedQty,
 *     unitPrice,
 *     excluded
 *   }
 * ]
 *
 * @param {Array} orderItems
 * @param {Object} supplier
 * @returns {Array<Object>}
 */
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
      // true means the row is excluded from the quotation
      excluded: existing?.excluded ?? false,
    };
  });
}

/**
 * Derives category names from quotation details.
 *
 * This is useful for showing which categories are represented in a quotation.
 *
 * @param {Array} quoteDetails
 * @param {Array} orderItems
 * @returns {string[]}
 */
function buildCategoriesFromQuoteDetails(quoteDetails = [], orderItems = []) {
  const productIds = quoteDetails.map((d) => d.productId);
  const categoryNames = orderItems
    .filter((item) => productIds.includes(item.productId))
    .map((item) => item.category);

  return [...new Set(categoryNames)];
}

/**
 * Determines whether the active quotation rows are complete enough
 * to be marked as OK.
 *
 * Conditions:
 * - There must be at least one active row.
 * - Every active row must have:
 *   - confirmedQty > 0
 *   - unitPrice > 0
 *
 * @param {Array} rows
 * @returns {boolean}
 */
function shouldBeOk(rows = []) {
  const activeRows = rows.filter((row) => !row.excluded);

  if (activeRows.length === 0) return false;

  return activeRows.every(
    (row) =>
      Number(row.confirmedQty) > 0 && Number(row.unitPrice) > 0
  );
}

/**
 * Calculates the next status for a quotation based on its rows.
 *
 * Rules:
 * - If all rows are excluded, the quotation becomes CANCELLED.
 * - If current status is UNSENT:
 *   - complete rows -> OK
 *   - incomplete rows -> PENDING
 * - If current status is PENDING:
 *   - complete rows -> OK
 *   - incomplete rows -> remain PENDING
 *
 * @param {number} currentStatus
 * @param {Array} rows
 * @returns {number}
 */
function buildNextStatus(currentStatus, rows = []) {
  const activeRows = rows.filter((row) => !row.excluded);

  // All rows excluded -> cancelled quotation
  if (activeRows.length === 0) {
    return STATUS.CANCELLED;
  }

  const complete = shouldBeOk(rows);

  if (currentStatus === STATUS.UNSENT) {
    // UNSENT -> OK if complete, otherwise PENDING
    return complete ? STATUS.OK : STATUS.PENDING;
  }

  if (currentStatus === STATUS.PENDING) {
    // PENDING -> OK if complete, otherwise stay PENDING
    return complete ? STATUS.OK : STATUS.PENDING;
  }

  return currentStatus;
}

/**
 * Converts a quotation loaded from the backend into the local supplier shape
 * used by the UI.
 *
 * This is used when reading existing quotations from the API.
 *
 * @param {Object} quote
 * @param {Array} orderItems
 * @returns {Object}
 */
function mapLoadedQuoteToSupplier(quote, orderItems = []) {
  return {
    id: quote.id, // quotation id
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

/**
 * Converts a just-generated backend response into the local supplier shape.
 *
 * The backend may return the full purchase request with a `quotes` array,
 * or in some cases may return the quote directly.
 *
 * @param {Object} response
 * @param {Object} supplier
 * @param {Array} orderItems
 * @returns {Object|null}
 */
function mapGeneratedQuoteToSupplier(response, supplier, orderItems = []) {
  // Find the quote that belongs to this supplier
  const quote = Array.isArray(response.quotes)
    ? response.quotes.find((q) => q.supplier?.id === supplier.supplierId)
    : response;

  if (!quote) {
    console.error(
      "[mapGeneratedQuoteToSupplier] no se encontró quote para supplierId:",
      supplier.supplierId
    );
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

/**
 * Converts a supplier selected from the search modal into a local row.
 *
 * At this stage, the supplier exists in the UI only.
 * No quotation has been generated yet.
 *
 * @param {Object} supplier
 * @returns {Object}
 */
function mapSelectedSupplierToLocalRow(supplier) {
  return {
    id: null, // no quotation yet
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

/**
 * Main hook used by the Purchase Requests detail view.
 *
 * @param {number|string} id
 * Purchase request identifier.
 *
 * @returns {Object}
 * A public API containing:
 * - loaded data
 * - derived data
 * - modal handlers
 * - quotation handlers
 * - supplier search handlers
 * - bulk actions
 */
export default function usePurchaseRequests(id) {
  // ── Remote data ────────────────────────────────────────────────────────────

  /**
   * Basic purchase request header data.
   */
  const [purchaseRequest, setPurchaseRequest] = useState(null);

  /**
   * Request items mapped into a UI-friendly structure.
   */
  const [orderItems, setOrderItems] = useState([]);

  /**
   * Supplier rows with quotation information.
   */
  const [suppliers, setSuppliers] = useState([]);

  /**
   * Loading indicator for initial fetch.
   */
  const [loading, setLoading] = useState(true);

  /**
   * Holds the current load or runtime error.
   */
  const [error, setError] = useState(null);

  // ── Modals ─────────────────────────────────────────────────────────────────

  /**
   * Currently active supplier quotation being shown in the modal.
   */
  const [activeSupplier, setActiveSupplier] = useState(null);

  /**
   * Controls supplier search modal visibility.
   */
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;

    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        const data = await getPurchaseRequestById(id);

        /**
         * Map the backend purchase request into a smaller object
         * that the UI actually needs.
         */
        setPurchaseRequest({
          id: data.id,
          createdAt: data.createdAt,
          requester: `${data.employee?.name ?? ""} ${data.employee?.surname ?? ""}`.trim(),
        });

        /**
         * Map request details into stable order item rows.
         */
        const mappedItems = (data.details ?? []).map((detail) => ({
          id: detail.product.id, // use productId as stable key
          productId: detail.product.id,
          code: detail.product.code,
          product: detail.product.description,
          category: detail.product.category.name,
          categoryId: detail.product.category.id,
          quantity: detail.quantity,
        }));

        setOrderItems(mappedItems);

        /**
         * Convert backend quotes into local supplier rows.
         */
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

  // ── Derived data ──────────────────────────────────────────────────────────

  /**
   * Category summary used by the CategoriesTable.
   *
   * Each category includes:
   * - id
   * - name
   * - category (compatibility alias)
   * - categoryId
   * - productCount
   * - items (compatibility array)
   * - assignedSuppliers
   */
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
      name: cat.name,
      category: cat.name,
      categoryId: cat.id,
      productCount: cat.productCount,
      items: Array(cat.productCount).fill(null),
      assignedSuppliers: suppliers.filter((supplier) => {
        // Do not count suppliers that still have no quotation generated
        if (supplier.statusId === STATUS.CREATED) return false;

        const supplierCategoryNames = normalizeCategoryNames(supplier.categories);

        if (supplierCategoryNames.length === 0) {
          return false;
        }

        return supplierCategoryNames.includes(cat.name);
      }).length,
    }));
  }, [orderItems, suppliers]);

  /**
   * Unique category names in the request.
   */
  const categoryNames = useMemo(
    () => [...new Set(orderItems.map((i) => i.category))],
    [orderItems]
  );

  /**
   * Unique category IDs in the request.
   */
  const categoryIds = useMemo(
    () => [...new Set(orderItems.map((i) => i.categoryId))],
    [orderItems]
  );

  /**
   * Returns true when every non-cancelled supplier already has a quotation.
   */
  const allGenerated = useMemo(() => {
    const active = suppliers.filter((s) => s.statusId !== STATUS.CANCELLED);
    return active.length > 0 && active.every((s) => s.statusId !== STATUS.CREATED);
  }, [suppliers]);

  /**
   * Returns true if at least one supplier can still be printed.
   * This includes CREATED, UNSENT, and PENDING suppliers.
   */
  const hasPrintableSuppliers = useMemo(() => {
    return suppliers.some(
      (s) =>
        s.statusId === STATUS.CREATED ||
        s.statusId === STATUS.UNSENT ||
        s.statusId === STATUS.PENDING
    );
  }, [suppliers]);

  // ── Quotation modal handlers ───────────────────────────────────────────────

  /**
   * Opens a quotation.
   *
   * If the supplier has no quotation yet, it generates one first
   * and then opens the modal.
   *
   * @param {Object} supplier
   */
  const handleOpenQuotation = async (supplier) => {
    if (!supplier) return;

    if (supplier.statusId === STATUS.CREATED || supplier.id == null) {
      await handleGenerateQuotation(supplier);
      return;
    }

    setActiveSupplier(supplier);
  };

  /**
   * Closes the quotation modal.
   */
  const handleCloseQuotation = () => setActiveSupplier(null);

  /**
   * Generates a new quotation for a supplier that does not have one yet.
   *
   * This performs a POST request and then updates local state.
   *
   * @param {Object} supplier
   */
  const handleGenerateQuotation = async (supplier) => {
    try {
      if (!supplier) return;

      // If quotation already exists, just open it
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

      if (!mappedSupplier) return;

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
   * Saves the current quotation state.
   *
   * This function:
   * - determines the next status
   * - calculates dateSent/dateReceived
   * - sends a PATCH request
   * - updates local supplier state
   *
   * @param {number|string} quoteId
   * @param {Array} rows
   * @param {boolean} _isComplete
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

      const activeRows = rows.filter((r) => !r.excluded);
      const allComplete =
        activeRows.length > 0 &&
        activeRows.every(
          (r) =>
            Number(r.confirmedQty) > 0 &&
            Number(r.unitPrice) > 0
        );

      const dateSent =
        activeRows.length > 0
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
          // Force a boolean value for the backend
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
   * Prints a single quotation.
   *
   * If the quotation is still UNSENT, it is first moved to PENDING
   * and dateSent is sent to the backend.
   *
   * @param {number|string} quoteId
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
   * Chooses between generating all quotations or printing all quotations.
   *
   * - If there are still suppliers without quotations, generate them all.
   * - Otherwise, print all printable quotations.
   */
  const handleGenerateOrPrintAll = async () => {
    if (!allGenerated) {
      await handleGenerateAll();
      return;
    }

    await handlePrintAll();
  };

  /**
   * Generates all quotations that are still in CREATED status.
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
        .filter(Boolean);

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
   * Prints all quotations that are still printable.
   *
   * Printable statuses:
   * - CREATED
   * - UNSENT
   * - PENDING
   *
   * Notes:
   * - OK and CANCELLED are excluded.
   * - UNSENT quotations are first updated to PENDING.
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

  function normalizeSuppliersResponse(response) {
    const raw = response?.suppliers ?? response;

    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      return Object.values(raw).filter(Boolean);
    }

    return [];
  }

  // ── Supplier search modal handlers ─────────────────────────────────────────

  /**
   * Opens the supplier search modal.
   */
  const handleOpenSupplierSearch = () => setIsSupplierSearchOpen(true);

  /**
   * Closes the supplier search modal.
   */
  const handleCloseSupplierSearch = () => setIsSupplierSearchOpen(false);

  /**
   * Searches available suppliers filtered by:
   * - text query
   * - categories of the current request
   *
   * It also excludes suppliers already added to the current view.
   *
   * Important note:
   * The backend uses AND for categories, but the UI needs OR behavior.
   * To emulate OR, one request per category is made and results are merged.
   *
   * @param {Object} params
   * @param {string} params.contains
   * @param {Array} params.categories
   * @returns {Promise<Array>}
   */
  const searchAvailableSuppliers = async ({
    contains = "",
    categories = categoryIds,
  } = {}) => {
    try {
      const searches =
        categories.length > 0
          ? await Promise.all(
              categories.map((catId) =>
                getSuppliers({ contains, categories: [catId] })
              )
            )
          : [await getSuppliers({ contains, categories: [] })];

      const seen = new Set();
      const result = searches
        .flatMap((response) => normalizeSuppliersResponse(response))
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
   * Adds suppliers selected from the search modal into local state.
   *
   * These suppliers are only added locally first.
   * A quotation will be created only when the user clicks "Generate".
   *
   * @param {Array} selectedSuppliers
   */
  const handleAddSuppliers = async (selectedSuppliers) => {
    try {
      const normalized = (selectedSuppliers ?? [])
        .map(mapSelectedSupplierToLocalRow)
        .filter((row) => row.supplierId != null);

      if (normalized.length === 0) return;

      setSuppliers((prev) => {
        const existingIds = new Set(prev.map((s) => s.supplierId));
        const newRows = normalized.filter(
          (row) => !existingIds.has(row.supplierId)
        );
        return [...prev, ...newRows];
      });

      setIsSupplierSearchOpen(false);
    } catch (err) {
      console.error("Error adding suppliers:", err);
    }
  };

  // ── Exposed API ───────────────────────────────────────────────────────────

  /**
   * The hook returns a public object consumed by the UI components.
   *
   * Returned data:
   * - purchaseRequest
   * - orderItems
   * - suppliers
   * - categories
   * - categoryNames
   * - categoryIds
   * - loading
   * - error
   *
   * Returned handlers:
   * - quotation modal actions
   * - supplier search modal actions
   * - print/generate bulk actions
   * - helper setters
   */
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

// Compatibility alias for older imports
export const usePurchaseOrder = usePurchaseRequests;
