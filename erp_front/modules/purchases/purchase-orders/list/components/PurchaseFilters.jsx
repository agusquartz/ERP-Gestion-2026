import React from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';

export default function PurchaseFilters({ 
  serverSearch, setServerSearch, 
  clientFilter, setClientFilter, 
  status, setStatus, 
  selectedDate, setSelectedDate,
  onClear 
}) {
  return (
    <div className="bg-white mb-6 p-2 border-b border-gray-200">
      <div className="flex items-end gap-3">
        
        {/* BUSCAR */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="serverSearch" className="block text-[11px] font-bold text-black mb-1 tracking-tight">
            Buscar
          </label>
          <input
            id="serverSearch"
            type="text"
            className="w-full px-3 py-1.5 bg-white border border-[#93A1A1] rounded text-[12px] outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-[#AAAAAA] placeholder:text-[12px]"
            placeholder="Buscar por N° Orden, Proveedor, N° Pedido..."
            value={serverSearch}
            onChange={(e) => setServerSearch(e.target.value)}
          />
        </div>

        {/* FILTRAR */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="clientFilter" className="block text-[11px] font-bold text-black mb-1 tracking-tight">
            Filtrar 
          </label>
          <input
            id="clientFilter"
            type="text"
            className="w-full px-3 py-1.5 bg-white border border-[#93A1A1] rounded text-[12px] outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-[#AAAAAA] placeholder:text-[12px]"
            placeholder="Filtrar por N° Orden, Proveedor, N° Pedido..."
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          />
        </div>

        {/* BUTTON GROUP */}
        <div className="flex items-center gap-2">

          {/* Date Selector */}
		  <div className="relative w-40">
            <input
              id="dateFilter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              // Changed py-2 to py-1.5 to match others
              className="w-full pl-5 pr-4 py-1.5 bg-[#E2E8F0] border border-gray-300 rounded text-xs font-bold text-slate-700 outline-none cursor-pointer uppercase select-none"
            />
          </div>

          {/* Status Selector */}
          <div className="relative w-32">
            <select 
              className="w-full appearance-none pl-3 pr-8 py-1.5 bg-[#E2E8F0] border border-gray-300 rounded text-xs font-bold text-slate-700 outline-none cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Estado</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="completado">Completado</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
          </div>

          {/* Clear Button */}
          <button 
            onClick={onClear}
            className="px-4 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold text-slate-700 hover:bg-gray-50 shadow-sm transition-all"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
      
    </div>
  );
}
