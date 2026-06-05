"use client";

export function PayrollFilters({
  search,
  setSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onCompute,
  loading,
}) {
  return (
    <div className="w-full space-y-4">
      {/* Fila 1: Período y Botón Computar */}
      <div>
        <h2 className="text-[15px] font-bold text-slate-800 mb-3">
          Definir Periodo de Pago
        </h2>
        <div className="flex flex-col sm:flex-row items-end gap-4 lg:max-w-4xl">
          <div className="flex flex-col gap-1.5 flex-1 w-full">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Inicio
            </label>
            <input
              type="date"
              className="w-full rounded-[5px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 w-full">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Fin
            </label>
            <input
              type="date"
              className="w-full rounded-[5px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          {/* NUEVO BOTÓN: Computar Período */}
          <button
            type="button"
            onClick={onCompute}
            disabled={loading || !startDate || !endDate}
            className="w-full sm:w-auto h-[45px] px-6 rounded-[5px] bg-slate-800 text-[14px] font-bold text-white shadow-sm hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Calculando..." : "Computar Período"}
          </button>
        </div>
      </div>

      {/* Fila 2: Buscar empleados */}
      <div>
        <h2 className="text-[15px] font-bold text-slate-800 mb-3">
          Seleccionar Empleados
        </h2>
        <input
          className="w-full max-w-sm rounded-[5px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
          placeholder="Filtrar por nombre, cargo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}