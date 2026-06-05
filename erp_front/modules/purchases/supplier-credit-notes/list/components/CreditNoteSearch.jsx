"use client";

import { useState } from "react";

export function CreditNoteSearch({ onSearch }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [since, setSince] = useState("");
  const [to, setTo] = useState("");

  // Función unificada que actualiza el estado local y avisa inmediatamente al padre
  const handleChange = (field, value) => {
    // Creamos el objeto con los datos actualizados al momento
    const updatedFilters = {
      search: field === "search" ? value : search,
      filter: field === "filter" ? value : filter,
      since: field === "since" ? value : since,
      to: field === "to" ? value : to,
    };

    // Aplicamos los cambios localmente
    if (field === "search") setSearch(value);
    if (field === "filter") setFilter(value);
    if (field === "since") setSince(value);
    if (field === "to") setTo(value);

    // Mandamos los datos limpios al ListPage sin pasar por efectos secundarios
    onSearch(updatedFilters);
  };

  const clearAll = () => {
    const defaultFilters = {
      search: "",
      filter: "",
      since: "",
      to: "",
    };
    
    setSearch("");
    setFilter("");
    setSince("");
    setTo("");
    
    onSearch(defaultFilters);
  };

  return (
    // CAMBIO: mismo espaciado general que DocumentsSearch
    <div className="w-full space-y-4 py-4">
      {/* CAMBIO: grid visual alineado al estilo de búsqueda de documentos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_auto_auto_auto] lg:items-end">
        
        {/* Buscar */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Búsqueda
          </label>

          <input
            type="text"
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Factura Nro, proveedor..."
            value={search}
            onChange={(e) => handleChange("search", e.target.value)}
          />
        </div>

        {/* Filtrar */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Filtrar resultados
          </label>

          <input
            type="text"
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Orden Nro"
            value={filter}
            onChange={(e) => handleChange("filter", e.target.value)}
          />
        </div>

        {/* Desde */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Desde
          </label>

          <input
            type="date"
            className="min-w-[150px] rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            value={since}
            onChange={(e) => handleChange("since", e.target.value)}
          />
        </div>

        {/* Hasta */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Hasta
          </label>

          <input
            type="date"
            className="min-w-[150px] rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            value={to}
            onChange={(e) => handleChange("to", e.target.value)}
          />
        </div>

        {/* Botón: Limpiar Filtros */}
        <button
          type="button"
          className="rounded-[8px] border border-slate-300 px-6 py-2.5 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
          onClick={clearAll}
        >
          Limpiar todo
        </button>
      </div>

      {/* CAMBIO: texto inferior igual al estilo de DocumentsSearch */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] text-slate-400">
          Mostrando resultados de búsqueda...
        </span>

        <span className="text-[11px] italic text-slate-400">
          Usá los filtros para consultar notas de crédito.
        </span>
      </div>
    </div>
  );
}