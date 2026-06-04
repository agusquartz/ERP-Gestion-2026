"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "pendiente", value: "pending" },
  { label: "parcial", value: "partial" },
  { label: "completado", value: "ok" },
];

export default function PurchaseFilters({ onSearch }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [since, setSince] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");

  function emit(next = {}) {
    const payload = {
      search,
      filter,
      since,
      to,
      status,
      ...next,
    };

    onSearch(payload);
  }

  function clearAll() {
    const empty = {
      search: "",
      filter: "",
      since: "",
      to: "",
      status: "",
    };

    setSearch("");
    setFilter("");
    setSince("");
    setTo("");
    setStatus("");

    onSearch(empty);
  }

  return (
    <div className="w-full space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_auto_auto_auto_auto] lg:items-end">
        
        {/* SEARCH */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Búsqueda
          </label>

          <input
            type="text"
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Buscar orden de compra"
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearch(val);
              emit({ search: val });
            }}
          />
        </div>

        {/* FILTER */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Filtrar resultados
          </label>

          <input
            type="text"
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Filtrar por proveedor, pedido"
            value={filter}
            onChange={(e) => {
              const val = e.target.value;
              setFilter(val);
              emit({ filter: val });
            }}
          />
        </div>

        {/* DATE FROM */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Desde
          </label>

          <input
            type="date"
            value={since}
            onChange={(e) => {
              const val = e.target.value;
              setSince(val);
              emit({ since: val });
            }}
            className="min-w-[150px] rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
          />
        </div>

        {/* DATE TO */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Hasta
          </label>

          <input
            type="date"
            value={to}
            onChange={(e) => {
              const val = e.target.value;
              setTo(val);
              emit({ to: val });
            }}
            className="min-w-[150px] rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
          />
        </div>

        {/* STATUS */}
        <div className="relative flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Estado
          </label>

          <div className="relative">
            <select
              className="min-w-[150px] appearance-none rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 pr-9 text-[14px] font-bold text-slate-700 outline-none transition hover:bg-slate-100 focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
              value={status}
              onChange={(e) => {
                const val = e.target.value;
                setStatus(val);
                emit({ status: val });
              }}
            >
              <option value="">Estado</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            />
          </div>
        </div>

        {/* CLEAR */}
        <button
          type="button"
          onClick={clearAll}
          className="rounded-[8px] border border-slate-300 px-6 py-2.5 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
        >
          Limpiar todo
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] text-slate-400">
          Mostrando resultados de búsqueda...
        </span>

        <span className="text-[11px] italic text-slate-400">
          Usá los filtros para consultar órdenes de compra.
        </span>
      </div>
    </div>
  );
}