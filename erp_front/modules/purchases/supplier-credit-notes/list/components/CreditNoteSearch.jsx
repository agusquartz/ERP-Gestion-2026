"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/shared/components/Icons";

export function CreditNoteSearch({ onSearch }) {
  const [query, setQuery] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showFromDrop, setShowFromDrop] = useState(false);
  const [showToDrop, setShowToDrop] = useState(false);

  const clearAll = () => {
    setQuery("");
    setFilterResult("");
    setFromDate("");
    setToDate("");
    setShowFromDrop(false);
    setShowToDrop(false);
    if (onSearch) onSearch({ query: "", filterResult: "", fromDate: "", toDate: "" });
  };

  const handleFilterChange = (updates) => {
    if (onSearch) {
      onSearch({
        query,
        filterResult,
        fromDate,
        toDate,
        ...updates
      });
    }
  };

  return (
    <div className="w-full space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_auto_auto_auto] lg:items-end">
        
        {/* Buscar */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-slate-800 ml-1">Buscar</label>
          <input
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Buscar por factura Nº, proveedor..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleFilterChange({ query: e.target.value });
            }}
          />
        </div>

        {/* Filtrar resultados */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-slate-800 ml-1">Filtrar Resultados</label>
          <input
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Filter by Description, SKU, Code..."
            value={filterResult}
            onChange={(e) => {
              setFilterResult(e.target.value);
              handleFilterChange({ filterResult: e.target.value });
            }}
          />
        </div>

        {/* Dropdown: Desde */}
        <div className="relative">
          <button
            type="button"
            className="flex min-w-[110px] items-center justify-between gap-2 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => { setShowFromDrop(!showFromDrop); setShowToDrop(false); }}
          >
            <span>{fromDate || "Desde"}</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFromDrop ? 'rotate-180' : ''}`} />
          </button>

          {showFromDrop && (
            <div className="absolute z-20 mt-2 right-0 w-[200px] rounded-[10px] border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-black/5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Fecha Inicial</label>
              <input 
                type="date" 
                className="w-full rounded-md border border-slate-200 px-2 py-1 text-[13px] text-slate-700 outline-none focus:border-[#2b6df5]"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setShowFromDrop(false);
                  handleFilterChange({ fromDate: e.target.value });
                }}
              />
            </div>
          )}
        </div>

        {/* Dropdown: Hasta */}
        <div className="relative">
          <button
            type="button"
            className="flex min-w-[110px] items-center justify-between gap-2 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => { setShowToDrop(!showToDrop); setShowFromDrop(false); }}
          >
            <span>{toDate || "Hasta"}</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showToDrop ? 'rotate-180' : ''}`} />
          </button>

          {showToDrop && (
            <div className="absolute z-20 mt-2 right-0 w-[200px] rounded-[10px] border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-black/5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Fecha Final</label>
              <input 
                type="date" 
                className="w-full rounded-md border border-slate-200 px-2 py-1 text-[13px] text-slate-700 outline-none focus:border-[#2b6df5]"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setShowToDrop(false);
                  handleFilterChange({ toDate: e.target.value });
                }}
              />
            </div>
          )}
        </div>

        {/* Botón: Limpiar Filtros */}
        <button
          type="button"
          className="rounded-[8px] border border-slate-300 bg-white px-5 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all active:scale-95"
          onClick={clearAll}
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}