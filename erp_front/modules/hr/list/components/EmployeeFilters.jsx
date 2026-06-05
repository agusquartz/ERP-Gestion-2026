"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/shared/components/Icons";

const STATUS_OPTIONS = [
  { label: "Activo", value: "active" },
  { label: "Inactivo", value: "inactive" },
];

export function EmployeeFilters({ search, setSearch, onNewEmployeeClick }) {
  const [showStatusDrop, setShowStatusDrop] = useState(false);

  function clearAll() {
    setSearch("");
  }

    return (
    <div className="w-full space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_auto_auto] lg:items-end">
        {/* Buscar */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Búsqueda
          </label>

          <input
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Filtrar por nombre, cargo o CI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Limpiar */}
        <button
          type="button"
          className="rounded-[8px] border border-slate-300 px-6 py-2.5 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
          onClick={clearAll}
        >
          Limpiar todo
        </button>

        {/* Nuevo empleado */}
        <button
          type="button"
          onClick={onNewEmployeeClick}
          className="inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-primary px-6 py-2.5 text-[14px] font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-95"
        >
          <span className="text-base font-normal">+</span>
          Nuevo Empleado
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] text-slate-400">
          Mostrando resultados de búsqueda...
        </span>

        <span className="text-[11px] italic text-slate-400">
          Filtrá empleados por nombre, cargo o documento.
        </span>
      </div>
    </div>
  );
}