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
    <div className="bg-white mb-6 p-2 border-b border-gray-200">
      <div className="flex items-end gap-3">

        {/* SEARCH */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-bold mb-1">
            Buscar
          </label>

          <input
            type="text"
            className="w-full px-3 py-1.5 border rounded text-[12px]"
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearch(val);
              emit({ search: val });
            }}
          />
        </div>

        {/* FILTER */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-bold mb-1">
            Filtrar
          </label>

          <input
            type="text"
            className="w-full px-3 py-1.5 border rounded text-[12px]"
            value={filter}
            onChange={(e) => {
              const val = e.target.value;
              setFilter(val);
              emit({ filter: val });
            }}
          />
        </div>

        {/* DATE FROM */}
        <div className="relative w-40">
          <input
            type="date"
            value={since}
            onChange={(e) => {
              const val = e.target.value;
              setSince(val);
              emit({ since: val });
            }}
            className="w-full px-3 py-1.5 bg-slate-200 border rounded text-xs"
          />
        </div>

        {/* DATE TO */}
        <div className="relative w-40">
          <input
            type="date"
            value={to}
            onChange={(e) => {
              const val = e.target.value;
              setTo(val);
              emit({ to: val });
            }}
            className="w-full px-3 py-1.5 bg-slate-200 border rounded text-xs"
          />
        </div>

        {/* STATUS */}
        <div className="relative w-32">
          <select
            className="w-full appearance-none px-3 py-1.5 bg-slate-200 border rounded text-xs"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            size={14}
          />
        </div>

        {/* CLEAR */}
        <button
          onClick={clearAll}
          className="px-4 py-1.5 border rounded text-xs font-bold"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
