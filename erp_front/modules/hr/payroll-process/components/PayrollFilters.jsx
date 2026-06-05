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
    <div className="w-full space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        {/* Fecha inicio */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Inicio
          </label>

          <input
            type="date"
            className="w-full rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* Fecha fin */}
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Fin
          </label>

          <input
            type="date"
            className="w-full rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Botón computar */}
        <button
          type="button"
          onClick={onCompute}
          disabled={loading || !startDate || !endDate}
          className="h-[42px] whitespace-nowrap rounded-[8px] bg-slate-800 px-6 py-2.5 text-[14px] font-bold text-white shadow-sm transition-all hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Calculando..." : "Computar Período"}
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] text-slate-400">
          Definí el período para calcular la nómina.
        </span>

        <span className="text-[11px] italic text-slate-400">
          Primero seleccioná inicio y fin, luego presioná{" "}
          <span className="font-bold">Computar Período</span>.
        </span>
      </div>
    </div>
  );
}