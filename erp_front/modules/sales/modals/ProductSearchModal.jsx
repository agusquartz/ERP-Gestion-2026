"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/shared/components/Modal";
import { ChevronDownIcon } from "@/shared/components/Icons";
import { getProductByQuery } from "../services/saleService";

/**
 * Modal de búsqueda y selección de productos.
 *
 * Props:
 *   open     - boolean
 *   onClose  - () => void
 *   onSelect - (product) => void
 */
export function ProductSearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [activeRow, setActiveRow] = useState(0);
  const [showCatDrop, setShowCatDrop] = useState(false);
  const inputRef = useRef(null);

  const categories = [...new Set(filtered.map((p) => p.category?.name))];

  useEffect(() => {
    if (open) {
      setQuery("");
      setDescFilter("");
      setCatFilter("");
      setFiltered([]);
      setActiveRow(0);
      setShowCatDrop(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);


  // Handles the Escape key to close the category dropdown first, or close the modal if the dropdown is not open.
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

  useEffect(() => {
    if (query.length < 3) {
      setFiltered([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        let response = await getProductByQuery(query);
		let f = response.products;

        if (descFilter) {
          f = f.filter(
            (p) =>
              p.description.toLowerCase().includes(descFilter.toLowerCase()) ||
              p.code.toLowerCase().includes(descFilter.toLowerCase())
          );
        }

        if (catFilter) {
          f = f.filter((p) => p.category?.name === catFilter);
        }

        setFiltered(f);
        setActiveRow(0);
      } catch (err) {
        setFiltered([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, descFilter, catFilter]);


  // Handles keyboard actions inside the search input: Escape closes the modal, Enter selects a product, and arrow keys move between rows.
  const handleKeyDown = (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    onClose();
    return;
  }

  if (e.key === "Enter" && filtered.length > 0) {
    e.preventDefault();
    onSelect(filtered[activeRow]);
    onClose();
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
    onSelect(product);
    onClose();
  };

  const clearAll = () => {
    setQuery("");
    setDescFilter("");
    setCatFilter("");
    setShowCatDrop(false);
  };

  return (
    <Modal open={open} onClose={onClose} width="80%">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Buscar Productos
        </h2>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
          <div>
            <p className="mb-1 text-xs font-semibold text-secondary">
              Buscar
            </p>
            <input
              ref={inputRef}
              className="w-full rounded-[5px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:bg-surface"
              placeholder="Buscar por Código, SKU, Descripción..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-secondary">
              Filtrar Resultados
            </p>
            <input
              className="w-full rounded-[5px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:bg-surface"
              placeholder="Filtrar por Descripción, SKU, Código..."
              value={descFilter}
              onChange={(e) => setDescFilter(e.target.value)}
            />
          </div>

          <div className="relative">
            <p className="mb-1 text-xs text-transparent">-</p>
            <button
              type="button"
              className="cursor-pointer flex min-w-[140px] items-center justify-between gap-2 rounded-[5px] border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-background"
              onClick={() => setShowCatDrop(!showCatDrop)}
            >
              <span>{catFilter || "Categoría"}</span>
              <ChevronDownIcon />
            </button>

            {showCatDrop && (
              <div className="absolute z-20 mt-2 w-full rounded-[5px] border border-border bg-surface p-1 shadow-panel">
                <button
                  type="button"
                  className="block w-full cursor-pointer rounded-[5px] px-3 py-2 text-left text-sm text-foreground transition hover:bg-background"
                  onClick={() => {
                    setCatFilter("");
                    setShowCatDrop(false);
                  }}
                >
                  Todas
                </button>

                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`block w-full cursor-pointer rounded-[5px] px-3 py-2 text-left text-sm transition ${
                      catFilter === c
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-background"
                    }`}
                    onClick={() => {
                      setCatFilter(c);
                      setShowCatDrop(false);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs text-transparent">-</p>
            <button
              type="button"
              className="cursor-pointer rounded-[5px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-background"
              onClick={clearAll}
            >
              Limpiar
            </button>
          </div>
        </div>

        <p className="text-xs text-muted">
          Mostrando {filtered.length} resultados
        </p>

        <div className="overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
          <div className="max-h-[420px] overflow-auto">
            <table className="min-w-full table-fixed border-collapse text-sm">
              <thead className="bg-background">
                <tr>
                  <th className="w-[12%] border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-secondary">
                    Código
                  </th>
                  <th className="w-[14%] border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-secondary">
                    SKU
                  </th>
                  <th className="w-[36%] border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-secondary">
                    Descripción
                  </th>
                  <th className="w-[16%] border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-secondary">
                    Categoría
                  </th>
                  <th className="w-[10%] border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-secondary">
                    Stock
                  </th>
                  <th className="w-[12%] border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-secondary">
                    Precio
                  </th>
                  <th className="w-[12%] border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-secondary">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`cursor-pointer border-b border-border transition hover:bg-background ${
                      activeRow === i ? "bg-blue-50" : "bg-surface"
                    }`}
                    onClick={() => setActiveRow(i)}
                    onDoubleClick={() => handleSelect(p)}
                  >
                    <td className="px-4 py-3 text-foreground">{p.code}</td>
                    <td className="px-4 py-3 text-foreground">{p.sku}</td>
                    <td
                      className="px-4 py-3 text-foreground"
                      title={p.description}
                    >
                      <div className="line-clamp-2 break-words">
                        {p.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{p.category?.name}</td>
                    <td className="px-4 py-3 text-foreground">{p.stock}</td>
                    <td className="px-4 py-3 text-foreground">{p.price}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-[5px] bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(p);
                        }}
                      >
                        Seleccionar
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-muted"
                    >
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-muted">
          Usá ↑ y ↓ para navegar, Enter para seleccionar y Esc para cerrar.
        </p>
      </div>
    </Modal>
  );
}
