"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/shared/components/Icons";

export function DocumentsSearch({ onSearch, activeTab }) {
  const [query, setQuery] = useState("");
  const [filterTotal, setFilterTotal] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [showDateDrop, setShowDateDrop] = useState(false);
  const [customDate, setCustomDate] = useState("");

  const dates = ["Hoy", "Esta Semana", "Este Mes", "Personalizado"];
  const status = ["Activo", "Expirado"];

  const clearAll = () => {
    setQuery("");
    setFilterTotal("");
    setStatusFilter("");
    setDateFilter("");
    setShowStatusDrop(false);
    setShowDateDrop(false);
  };

  return (
    <div className="w-full space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_auto_auto_auto] lg:items-end">
        
        {/* Search */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-slate-800 ml-1">Búsqueda</label>
          <input
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Buscar por nombre de cliente"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Total filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-slate-800 ml-1">Filtrar resultados</label>
          <input
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Filtrar por total, factura"
            value={filterTotal}
            onChange={(e) => setFilterTotal(e.target.value)}
          />
        </div>

        {/* Status Dropdown, only quotes */}
        {activeTab === "Presupuesto" && (
          <div className="relative">
            <button
              type="button"
              className="flex min-w-[150px] items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => { setShowStatusDrop(!showStatusDrop); setShowDateDrop(false); }}
            >
              <span>{statusFilter || "Estado"}</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showStatusDrop ? 'rotate-180' : ''}`} />
            </button>

            {showStatusDrop && (
              <div className="absolute z-20 mt-2 w-full rounded-[10px] border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                <button
                  className="w-full rounded-md px-3 py-2 text-left text-[14px] text-slate-600 hover:bg-slate-50 transition-colors"
                  onClick={() => { setStatusFilter(""); setShowStatusDrop(false); }}
                >
                  Todas
                </button>
                {status.map((c) => (
                  <button
                    key={c}
                    className="w-full rounded-md px-3 py-2 text-left text-[14px] font-medium text-slate-700 hover:bg-[#f0f7ff] hover:text-[#2b6df5] transition-colors"
                    onClick={() => { setStatusFilter(c); setShowStatusDrop(false); }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

       {/* DATE Dropdown  */}
        <div className="relative">
          <button
            type="button"
            className="flex min-w-[130px] items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => { setShowDateDrop(!showDateDrop); setShowStatusDrop(false); }}
          >
           {/* If there is a custom date, display it; otherwise, display the selected filter or "Date" */}
            <span>{customDate || dateFilter || "Fecha"}</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showDateDrop ? 'rotate-180' : ''}`} />
          </button>

          {showDateDrop && (
            <div className="absolute z-20 mt-2 w-full min-w-[160px] rounded-[10px] border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
              {dates.map((d) => (
                <div key={d}>
                  {d === "Personalizado" ? (
                    <div className="px-3 py-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Elegir fecha</label>
                      <input 
                        type="date" 
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-[13px] text-slate-700 outline-none focus:border-[#2b6df5]"
                        onChange={(e) => {
                          setCustomDate(e.target.value);
                          setDateFilter("Personalizado");
                          
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      className="w-full rounded-md px-3 py-2 text-left text-[14px] font-medium text-slate-700 hover:bg-[#f0f7ff] hover:text-[#2b6df5] transition-colors"
                      onClick={() => { 
                        setDateFilter(d); 
                        setCustomDate(""); 
                        setShowDateDrop(false); 
                      }}
                    >
                      {d}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        

        <button
          type="button"
          className="rounded-[8px] border border-slate-300 px-6 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all active:scale-95"
          onClick={clearAll}
        >
          Limpiar todo
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
         <span className="text-[12px] text-slate-400">Mostrando resultados de búsqueda...</span>
         <span className="text-[11px] text-slate-400 italic">
           Usa <span className="font-bold">↑ y ↓</span> para navegar y <span className="font-bold">Enter</span> para seleccionar.
         </span>
      </div>
    </div>
  );
}