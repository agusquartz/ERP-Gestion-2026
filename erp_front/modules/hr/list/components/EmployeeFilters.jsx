"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/shared/components/Icons";

const STATUS_OPTIONS = [
  { label: "Activo", value: "Activo" },
  { label: "Inactivo", value: "Inactivo" },
];

export function EmployeeFilters({ onSearch, onNewEmployeeClick }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showStatusDrop, setShowStatusDrop] = useState(false);

  function emit(overrides) {
    onSearch({ search, status, ...overrides });
  }

  function clearAll() {
    setSearch("");
    setStatus("");
    setShowStatusDrop(false);
    onSearch({ search: "", status: "" });
  }

  return (
    <div className="w-full space-y-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        
        {/* Filtros Izquierda */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_auto] items-end w-full lg:max-w-3xl">
          {/* Input Buscar */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-800 ml-1">Filter Results</label>
            <input
              className="w-full rounded-[5px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
              placeholder="Filtrar por nombre, cargo..."
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                emit({ search: val });
              }}
            />
          </div>

          {/* Dropdown Estado */}
          <div className="relative flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-slate-800 ml-1">Estado</label>
            <button
              type="button"
              className="flex min-w-[150px] items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setShowStatusDrop((prev) => !prev)}
            >
              <span>
                {STATUS_OPTIONS.find((s) => s.value === status)?.label ?? "Estado: Todos"}
              </span>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${showStatusDrop ? "rotate-180" : ""}`}
              />
            </button>

            {showStatusDrop && (
              <div className="absolute top-full z-20 mt-2 w-full rounded-[10px] border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                <button
                  className="w-full rounded-md px-3 py-2 text-left text-[14px] text-slate-600 hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    setStatus("");
                    setShowStatusDrop(false);
                    emit({ status: "" });
                  }}
                >
                  Todos
                </button>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    className="w-full rounded-md px-3 py-2 text-left text-[14px] text-slate-600 hover:bg-[#f0f7ff] hover:text-[#2b6df5] transition-colors"
                    onClick={() => {
                      setStatus(s.value);
                      setShowStatusDrop(false);
                      emit({ status: s.value });
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
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

        {/* Acciones Derecha - Figma Button */}
        <button
          type="button"
          onClick={onNewEmployeeClick}
          className="rounded-[5px] bg-[#2b6df5] px-5 py-2.5 text-[14px] font-bold text-white shadow-sm hover:bg-[#1a56db] transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto"
        >
          <span class="text-base font-normal">+</span> Nuevo Empleado
        </button>

      </div>
    </div>
  );
}