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
    <div className="w-full space-y-2 py-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        
        {/* Filtros Izquierda */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_auto] items-end w-full lg:max-w-3xl">
          {/* Input Buscar */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-800 ml-1">Filter Results</label>
            <input
              className="w-full rounded-[5px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
              placeholder="Filtrar por nombre, cargo o CI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Limpiar Filtros */}
          <button
            type="button"
            className="rounded-[5px] border border-slate-300 px-5 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 h-[42px]"
            onClick={clearAll}
          >
            Limpiar
          </button>
        </div>

        {/* Acciones Derecha */}
        <button
          type="button"
          onClick={onNewEmployeeClick}
          className="rounded-[5px] bg-[#2b6df5] px-5 py-2.5 text-[14px] font-bold text-white shadow-sm hover:bg-[#1a56db] transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto"
        >
          <span className="text-base font-normal">+</span> Nuevo Empleado
        </button>

      </div>
    </div>
  );
}





