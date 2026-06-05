// "use client";

// import { useState } from "react";
// import { ChevronDownIcon } from "@/shared/components/Icons";

// export function OrderSearch({ onSearch }) {
//   const [query, setQuery] = useState("");
//   const [filterResult, setFilterResult] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [dateFilter, setDateFilter] = useState("");
  
//   // Estado para la fecha personalizada (igual que DocumentsSearch)
//   const [customDate, setCustomDate] = useState("");
  
//   const [showStatusDrop, setShowStatusDrop] = useState(false);
//   const [showDateDrop, setShowDateDrop] = useState(false);

//   const dates = ["Hoy", "Esta Semana", "Este Mes", "Personalizado"];
//   const status = ["Pendiente", "Recibido", "Cancelado"];

//   const clearAll = () => {
//     setQuery("");
//     setFilterResult("");
//     setStatusFilter("");
//     setDateFilter("");
//     setCustomDate("");
//     setShowStatusDrop(false);
//     setShowDateDrop(false);
//   };

//   return (
//     <div className="w-full space-y-4 py-4">
  
//       <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_auto_auto_auto] lg:items-end">
        
//         {/* Buscar */}
//         <div className="flex flex-col gap-1.5">
//           <label className="text-[13px] font-bold text-slate-800 ml-1">Buscar</label>
//           <input
//             className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
//             placeholder="Buscar por proveedor..."
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />
//         </div>

//         {/* Filtrar resultados */}
//         <div className="flex flex-col gap-1.5">
//           <label className="text-[13px] font-bold text-slate-800 ml-1">Filtrar resultados</label>
//           <input
//             className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
//             placeholder="Nro. pedido, total..."
//             value={filterResult}
//             onChange={(e) => setFilterResult(e.target.value)}
//           />
//         </div>

//         {/* Dropdown: Estado */}
//         <div className="relative">
//           <button
//             type="button"
//             className="flex min-w-[150px] items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
//             onClick={() => { setShowStatusDrop(!showStatusDrop); setShowDateDrop(false); }}
//           >
//             <span>{statusFilter || "Estado"}</span>
//             <ChevronDownIcon className={`w-4 h-4 transition-transform ${showStatusDrop ? 'rotate-180' : ''}`} />
//           </button>

//           {showStatusDrop && (
//             <div className="absolute z-20 mt-2 w-full rounded-[10px] border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
//               <button
//                 className="w-full rounded-md px-3 py-2 text-left text-[14px] text-slate-600 hover:bg-slate-50 transition-colors"
//                 onClick={() => { setStatusFilter(""); setShowStatusDrop(false); }}
//               >
//                 Todos
//               </button>
//               {status.map((s) => (
//                 <button
//                   key={s}
//                   className="w-full rounded-md px-3 py-2 text-left text-[14px] font-medium text-slate-700 hover:bg-[#f0f7ff] hover:text-[#2b6df5] transition-colors"
//                   onClick={() => { setStatusFilter(s); setShowStatusDrop(false); }}
//                 >
//                   {s}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Dropdown: Fecha (Estilo DocumentsSearch) */}
//         <div className="relative">
//           <button
//             type="button"
//             className="flex min-w-[130px] items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
//             onClick={() => { setShowDateDrop(!showDateDrop); setShowStatusDrop(false); }}
//           >
//             <span>{customDate || dateFilter || "Fecha"}</span>
//             <ChevronDownIcon className={`w-4 h-4 transition-transform ${showDateDrop ? 'rotate-180' : ''}`} />
//           </button>

//           {showDateDrop && (
//             <div className="absolute z-20 mt-2 w-full min-w-[160px] rounded-[10px] border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
//               {dates.map((d) => (
//                 <div key={d}>
//                   {d === "Personalizado" ? (
//                     <div className="px-3 py-2 border-t border-slate-50 mt-1">
//                       <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Elegir fecha</label>
//                       <input 
//                         type="date" 
//                         className="w-full rounded-md border border-slate-200 px-2 py-1 text-[13px] text-slate-700 outline-none focus:border-[#2b6df5]"
//                         onChange={(e) => {
//                           setCustomDate(e.target.value);
//                           setDateFilter("Personalizado");
//                           // No cerramos el dropdown para que el usuario vea la fecha seleccionada
//                         }}
//                       />
//                     </div>
//                   ) : (
//                     <button
//                       className="w-full rounded-md px-3 py-2 text-left text-[14px] font-medium text-slate-700 hover:bg-[#f0f7ff] hover:text-[#2b6df5] transition-colors"
//                       onClick={() => { 
//                         setDateFilter(d); 
//                         setCustomDate(""); 
//                         setShowDateDrop(false); 
//                       }}
//                     >
//                       {d}
//                     </button>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Botón: Limpiar */}
//         <button
//           type="button"
//           className="rounded-[8px] border border-slate-300 px-6 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all active:scale-95"
//           onClick={clearAll}
//         >
//           Limpiar filtros
//         </button>
//       </div>

//       <div className="flex items-center justify-between px-1">
//          <span className="text-[12px] text-slate-400">Mostrando pedidos según criterios...</span>
//          <span className="text-[11px] text-slate-400 italic">
//            Usa <span className="font-bold">↑ y ↓</span> <span className="font-bold">Enter</span> para seleccionar.
//          </span>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon } from "@/shared/components/Icons";

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDateRange(dateFilter, customDate) {
  const today = new Date();

  if (dateFilter === "Hoy") {
    const date = toInputDate(today);
    return { since: date, to: date };
  }

  if (dateFilter === "Esta Semana") {
    const start = new Date(today);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    start.setDate(start.getDate() + diff);

    return {
      since: toInputDate(start),
      to: toInputDate(today),
    };
  }

  if (dateFilter === "Este Mes") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      since: toInputDate(start),
      to: toInputDate(today),
    };
  }

  if (dateFilter === "Personalizado" && customDate) {
    return {
      since: customDate,
      to: customDate,
    };
  }

  return {
    since: "",
    to: "",
  };
}

export function OrderSearch({ onSearch }) {
  const [query, setQuery] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [customDate, setCustomDate] = useState("");

  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [showDateDrop, setShowDateDrop] = useState(false);

  const dates = ["Hoy", "Esta Semana", "Este Mes", "Personalizado"];
  const status = ["Pendiente", "Recibido", "Cancelado"];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const dateRange = getDateRange(dateFilter, customDate);

      onSearch({
        search: query,
        filter: filterResult,
        status: statusFilter,
        since: dateRange.since,
        to: dateRange.to,
      });
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [query, filterResult, statusFilter, dateFilter, customDate, onSearch]);

  const clearAll = () => {
    setQuery("");
    setFilterResult("");
    setStatusFilter("");
    setDateFilter("");
    setCustomDate("");
    setShowStatusDrop(false);
    setShowDateDrop(false);
  };

  return (
    <div className="w-full space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_auto_auto_auto] lg:items-end">
        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Buscar
          </label>

          <input
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Buscar por empleado o pedido..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[13px] font-bold text-slate-800">
            Filtrar resultados
          </label>

          <input
            className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
            placeholder="Nro. pedido, empleado..."
            value={filterResult}
            onChange={(event) => setFilterResult(event.target.value)}
          />
        </div>

        <div className="relative">
          <button
            type="button"
            className="flex min-w-[150px] items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 transition-colors hover:bg-slate-100"
            onClick={() => {
              setShowStatusDrop(!showStatusDrop);
              setShowDateDrop(false);
            }}
          >
            <span>{statusFilter || "Estado"}</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${
                showStatusDrop ? "rotate-180" : ""
              }`}
            />
          </button>

          {showStatusDrop && (
            <div className="absolute z-20 mt-2 w-full rounded-[10px] border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-left text-[14px] text-slate-600 transition-colors hover:bg-slate-50"
                onClick={() => {
                  setStatusFilter("");
                  setShowStatusDrop(false);
                }}
              >
                Todos
              </button>

              {status.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="w-full rounded-md px-3 py-2 text-left text-[14px] font-medium text-slate-700 transition-colors hover:bg-[#f0f7ff] hover:text-[#2b6df5]"
                  onClick={() => {
                    setStatusFilter(item);
                    setShowStatusDrop(false);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            className="flex min-w-[130px] items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 transition-colors hover:bg-slate-100"
            onClick={() => {
              setShowDateDrop(!showDateDrop);
              setShowStatusDrop(false);
            }}
          >
            <span>{customDate || dateFilter || "Fecha"}</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${
                showDateDrop ? "rotate-180" : ""
              }`}
            />
          </button>

          {showDateDrop && (
            <div className="absolute z-20 mt-2 w-full min-w-[160px] rounded-[10px] border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
              {dates.map((dateOption) => (
                <div key={dateOption}>
                  {dateOption === "Personalizado" ? (
                    <div className="mt-1 border-t border-slate-50 px-3 py-2">
                      <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
                        Elegir fecha
                      </label>

                      <input
                        type="date"
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-[13px] text-slate-700 outline-none focus:border-[#2b6df5]"
                        value={customDate}
                        onChange={(event) => {
                          setCustomDate(event.target.value);
                          setDateFilter("Personalizado");
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full rounded-md px-3 py-2 text-left text-[14px] font-medium text-slate-700 transition-colors hover:bg-[#f0f7ff] hover:text-[#2b6df5]"
                      onClick={() => {
                        setDateFilter(dateOption);
                        setCustomDate("");
                        setShowDateDrop(false);
                      }}
                    >
                      {dateOption}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="rounded-[8px] border border-slate-300 px-6 py-2.5 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
          onClick={clearAll}
        >
          Limpiar filtros
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] text-slate-400">
          Mostrando pedidos según criterios...
        </span>

        <span className="text-[11px] italic text-slate-400">
          Usa <span className="font-bold">↑ y ↓</span>{" "}
          <span className="font-bold">Enter</span> para seleccionar.
        </span>
      </div>
    </div>
  );
}