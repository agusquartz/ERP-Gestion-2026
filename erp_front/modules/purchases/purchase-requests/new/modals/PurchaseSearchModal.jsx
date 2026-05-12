"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/shared/components/Modal";
import { ChevronDownIcon } from "@/shared/components/Icons";
import { getProductByQuery } from "@/lib/http/client/sales";

/**
 * Modal adapted for searching tires and products within the Procurement module.
 * Features keyboard navigation and dynamic multi-layer filtering.
 */
export function PurchaseSearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [activeRow, setActiveRow] = useState(0);
  const [showCatDrop, setShowCatDrop] = useState(false);
  const inputRef = useRef(null);


  // Extract unique categories from search results for the dropdown filter
  const categories = [...new Set(filtered.map((p) => p.category?.name))];


  // RESET: Clear states and auto-focus the main input when the modal opens
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

  // DEBOUNCE SEARCH: Wait 300ms after typing to prevent excessive API calls
  useEffect(() => {
    if (query.length < 3) {
      setFiltered([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Fetch products matching the main search term
        let f = await getProductByQuery(query);

        // Client-side filtering by description/code for refined searches
        if (descFilter) {
          const term = descFilter.toLowerCase();
          f = f.filter(
            (p) =>
              p.description.toLowerCase().includes(term) ||
              p.code.toLowerCase().includes(term)
          );
        }

        // Filter results by selected category
        if (catFilter) f = f.filter((p) => p.category?.name === catFilter);

        setFiltered(f);
        setActiveRow(0);
      } catch (err) {
        setFiltered([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, descFilter, catFilter]);

  // ACCESSIBILITY: Handle keyboard arrows and Enter for rapid selection
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filtered.length > 0) {
      handleSelect(filtered[activeRow]);
    } else if (e.key === "ArrowDown") {
      setActiveRow((r) => Math.min(r + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      setActiveRow((r) => Math.max(r - 1, 0));
    }
  };

  /**
   * Finalizes the selection by passing the product to the parent component.
   */
  const handleSelect = (product) => {
    if (!product) return;
    onSelect(product); 
    onClose();        
  };

  /**
   * Resets all search and filter inputs.
   */
  const clearAll = () => {
    setQuery("");
    setDescFilter("");
    setCatFilter("");
  };

  return (
    <Modal open={open} onClose={onClose} width="85%">
      <div className="space-y-5 p-2">
        <h2 className="text-2xl font-bold text-slate-800">Buscar productos</h2>

        {/* FILTER BAR SECTION */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_auto_auto_auto] items-end">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Buscar</label>
            <input
              ref={inputRef}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
              placeholder="Search by Code, SKU, Description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Filtrar Resultados</label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
              placeholder="Filter by Description, SKU, Code..."
              value={descFilter}
              onChange={(e) => setDescFilter(e.target.value)}
            />
          </div>

          {/* CATEGORY DROPDOWN SELECTOR */}
          <div className="relative">
            <button
              onClick={() => setShowCatDrop(!showCatDrop)}
              className="flex min-w-[150px] items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span>{catFilter || "Categoría"}</span>
              <ChevronDownIcon />
            </button>
            {/* Category selection dropdown */}
            {showCatDrop && (
              <div className="absolute z-30 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-xl p-1">
                <button onClick={() => {setCatFilter(""); setShowCatDrop(false)}} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded">Todas</button>
                {categories.map(c => (
                  <button key={c} onClick={() => {setCatFilter(c); setShowCatDrop(false)}} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded">{c}</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={clearAll} className="px-6 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
            Limpiar
          </button>
        </div>

        {/* RESULTS TABLE SECTION */}
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
          <div className="max-h-[450px] overflow-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">Código</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">Stock</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">Precio</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr 
                    key={p.id} 
                    className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${activeRow === i ? 'bg-blue-50' : ''}`}
                    onClick={() => setActiveRow(i)}
                  >
                    <td className="px-4 py-4 font-medium text-slate-700">{p.code}</td>
                    <td className="px-4 py-4 text-slate-600">{p.description}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">{p.category?.name }</span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-semibold">{p.stock}</td>
                    <td className="px-4 py-4 text-slate-600">${p.price}</td>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => handleSelect(p)}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NAVIGATION HINT */}
        <p className="text-center text-[11px] text-slate-400 italic">
          Use ↑ and ↓ to navigate and Enter to select.
        </p>
      </div>
    </Modal>
  );
}