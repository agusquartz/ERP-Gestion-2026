"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/shared/components/Icons";

const STATUS_OPTIONS = [
	{ label: "Pagado",         value: "paid"            },
	{ label: "Pago Parcial",   value: "partial_payment" },
	{ label: "Pago Pendiente", value: "payment_pending" },
];

export function InvoiceFilters({ onSearch }) {
	const [search, setSearch]         			= useState("");
	const [filter, setFilter]					= useState("");
	const [from, setFrom]           			= useState("");
	const [to, setTo]             				= useState("");
	const [status, setStatus]       			= useState("");
	const [showStatusDrop, setShowStatusDrop] 	= useState(false);

	// Builds and emits the full filter state every time any field changes.
	// Empty strings are kept here — the hook strips them before sending to the API.
	function emit(overrides) {
		onSearch({ search, filter, from, to, status, ...overrides });
	}

	function clearAll() {
		setSearch("");
		setFilter("");
		setFrom("");
		setTo("");
		setStatus("");
		setShowStatusDrop(false);
		onSearch({ search: "", filter: "", from: "", to: "", status: "" });
	}

	return (
		<div className="w-full space-y-4 py-4">
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_auto_auto_auto_auto_auto] lg:items-end">

				{/* Search — covers invoice number and supplier name on the backend */}
				<div className="flex flex-col gap-1.5">
					<label className="text-[13px] font-bold text-slate-800 ml-1">Buscar</label>
					<input
						className="w-full rounded-[5px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
						placeholder="Factura Nro, Proveedor..."
						value={search}
						onChange={(e) => {
							const val = e.target.value;
							setSearch(val);
							emit({ search: val });
						}}
					/>
				</div>

				{/* Filter */}
				<div className="flex flex-col gap-1.5">
    			<label className="text-[13px] font-bold text-slate-800 ml-1">Filtrar</label>
			    <input
			        className="w-full rounded-[5px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
			        placeholder="Orden Nro"
			        value={filter}
			        onChange={(e) => {
			            const val = e.target.value;
			            setFilter(val);
			            emit({ filter: val });
			        }}
			    />
				</div>

				{/* From */}
				<div className="flex flex-col gap-1.5">
					<label className="text-[13px] font-bold text-slate-800 ml-1">Desde</label>
					<input
						type="date"
						className="rounded-[5px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
						value={from}
						onChange={(e) => {
							const val = e.target.value;
							setFrom(val);
							emit({ from: val });
						}}
					/>
				</div>

				{/* To */}
				<div className="flex flex-col gap-1.5">
					<label className="text-[13px] font-bold text-slate-800 ml-1">Hasta</label>
					<input
						type="date"
						className="rounded-[5px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10"
						value={to}
						onChange={(e) => {
							const val = e.target.value;
							setTo(val);
							emit({ to: val });
						}}
					/>
				</div>

				{/* Status dropdown */}
				<div className="relative flex flex-col gap-1.5">
					<label className="text-[13px] font-bold text-slate-800 ml-1">Estado</label>
					<button
						type="button"
						className="flex min-w-[160px] items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
						onClick={() => setShowStatusDrop((prev) => !prev)}
					>
						<span>
							{STATUS_OPTIONS.find((s) => s.value === status)?.label ?? "Estado"}
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

				{/* Clear */}
				<div className="flex flex-col justify-end">
					<button
						type="button"
						className="rounded-[5px] border border-slate-300 px-6 py-2.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all active:scale-95"
						onClick={clearAll}
					>
						Limpiar Filtros
					</button>
				</div>
			</div>
		</div>
	);
}