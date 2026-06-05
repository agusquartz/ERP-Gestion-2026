"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/shared/components/Modal";
import { ChevronDownIcon } from "@/shared/components/Icons";
import { getProductByQuery } from "@/lib/http/client/sales";

const PRODUCT_PAGE_SIZE = 10;

/**
 * Modal adapted for searching tires and products within the Procurement module.
 * Features keyboard navigation, dynamic multi-layer filtering and cursor pagination.
 */
export function PurchaseSearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [activeRow, setActiveRow] = useState(0);
  const [showCatDrop, setShowCatDrop] = useState(false);
  const inputRef = useRef(null);

  const [productCursor, setProductCursor] = useState(null);
  const [productCursorStack, setProductCursorStack] = useState([]);
  const [productHasMore, setProductHasMore] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Extract unique categories from current search results for the dropdown filter.
  const categories = [...new Set(filtered.map((p) => p.category?.name).filter(Boolean))];

  const resetProductPagination = () => {
    setProductCursor(null);
    setProductCursorStack([]);
    setProductHasMore(false);
  };

  // RESET: Clear states and auto-focus the main input when the modal opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setDescFilter("");
      setCatFilter("");
      setFiltered([]);
      setActiveRow(0);
      setShowCatDrop(false);
      resetProductPagination();
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // ESC: Close category dropdown first, otherwise close modal.
  useEffect(() => {
    if (!open) return;

    function handleEscape(event) {
      if (event.key === "Escape") {
        if (showCatDrop) {
          setShowCatDrop(false);
          return;
        }

        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, showCatDrop]);

  // DEBOUNCE SEARCH: Wait 300ms after typing to prevent excessive API calls.
  useEffect(() => {
    if (!open) return;

    if (query.trim().length < 3) {
      setFiltered([]);
      setProductHasMore(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setIsLoadingProducts(true);

        const response = await getProductByQuery({
          search: query,
          filter: descFilter,
          cursor: productCursor,
          limit: PRODUCT_PAGE_SIZE,
        });

        let products = Array.isArray(response)
          ? response
          : response?.products ?? [];

        // Local filter because ProductListQuery does not have categoryId/categoryName yet.
        if (catFilter) {
          products = products.filter((p) => p.category?.name === catFilter);
        }

        if (!cancelled) {
          setFiltered(products);
          setProductHasMore(
            Boolean(response?.hasMore ?? response?.has_more ?? false)
          );
          setActiveRow(0);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Products could not be loaded:", err);
          setFiltered([]);
          setProductHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProducts(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    open,
    query,
    descFilter,
    catFilter,
    productCursor,
  ]);

  // ACCESSIBILITY: Handle keyboard arrows and Enter for rapid selection.
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      handleSelect(filtered[activeRow]);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveRow((r) => Math.min(r + 1, filtered.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveRow((r) => Math.max(r - 1, 0));
    }
  };

  const handleSelect = (product) => {
    if (!product) return;

    onSelect(product);
    onClose();
  };

  const clearAll = () => {
    setQuery("");
    setDescFilter("");
    setCatFilter("");
    setFiltered([]);
    setActiveRow(0);
    setShowCatDrop(false);
    resetProductPagination();
  };

  const handleNextProductPage = () => {
    if (!filtered.length || !productHasMore) return;

    const lastProduct = filtered[filtered.length - 1];

    setProductCursorStack((prev) => [...prev, productCursor]);
    setProductCursor(lastProduct.id);
  };

  const handlePreviousProductPage = () => {
    if (!productCursorStack.length) return;

    const previousCursor = productCursorStack[productCursorStack.length - 1];

    setProductCursorStack((prev) => prev.slice(0, -1));
    setProductCursor(previousCursor);
  };

  return (
    <Modal open={open} onClose={onClose} width="85%">
      <div className="space-y-5 p-2">
        <h2 className="text-2xl font-bold text-slate-800">
          Buscar productos
        </h2>

        {/* FILTER BAR SECTION */}
        <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[1.5fr_1.5fr_auto_auto]">
          <div className="space-y-1">
            <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">
              Buscar
            </label>

            <input
              ref={inputRef}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white"
              placeholder="Search by Code, SKU, Description..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetProductPagination();
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-1">
            <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">
              Filtrar Resultados
            </label>

            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white"
              placeholder="Filter by Description, SKU, Code..."
              value={descFilter}
              onChange={(e) => {
                setDescFilter(e.target.value);
                resetProductPagination();
              }}
            />
          </div>

          {/* CATEGORY DROPDOWN SELECTOR */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCatDrop((prev) => !prev)}
              className="flex min-w-[150px] items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span>{catFilter || "Categoría"}</span>
              <ChevronDownIcon />
            </button>

            {showCatDrop && (
              <div className="absolute z-30 mt-2 max-h-[260px] w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCatFilter("");
                    resetProductPagination();
                    setShowCatDrop(false);
                  }}
                  className="w-full rounded px-3 py-2 text-left text-sm hover:bg-blue-50"
                >
                  Todas
                </button>

                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setCatFilter(category);
                      resetProductPagination();
                      setShowCatDrop(false);
                    }}
                    className={`w-full rounded px-3 py-2 text-left text-sm transition ${
                      catFilter === category
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100"
          >
            Limpiar
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Mostrando {filtered.length} resultados
          </span>

          {query.trim().length >= 3 && (
            <span>
              Página {productCursorStack.length + 1}
            </span>
          )}
        </div>

        {/* RESULTS TABLE SECTION */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[450px] overflow-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-400">
                    Código
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-400">
                    Descripción
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-400">
                    Categoría
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-400">
                    Stock
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-400">
                    Precio
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-400">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoadingProducts && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-400"
                    >
                      Cargando productos...
                    </td>
                  </tr>
                )}

                {!isLoadingProducts &&
                  filtered.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/30 ${
                        activeRow === index ? "bg-blue-50" : ""
                      }`}
                      onClick={() => setActiveRow(index)}
                      onDoubleClick={() => handleSelect(product)}
                    >
                      <td className="px-4 py-4 font-medium text-slate-700">
                        {product.code}
                      </td>

                      <td
                        className="px-4 py-4 text-slate-600"
                        title={product.description}
                      >
                        <div className="line-clamp-2 break-words">
                          {product.description}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
                          {product.category?.name || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {product.stock}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        ${product.price}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSelect(product);
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}

                {!isLoadingProducts && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-400"
                    >
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Mostrando {filtered.length} productos
            </span>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handlePreviousProductPage}
                disabled={!productCursorStack.length || isLoadingProducts}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={handleNextProductPage}
                disabled={!productHasMore || isLoadingProducts}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* NAVIGATION HINT */}
        <p className="text-center text-[11px] italic text-slate-400">
          Use ↑ and ↓ to navigate, Enter to select and Esc to close.
        </p>
      </div>
    </Modal>
  );
}