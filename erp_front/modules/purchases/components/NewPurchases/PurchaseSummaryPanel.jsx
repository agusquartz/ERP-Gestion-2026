"use client";

import { s } from "../../styles/NewPurchase/NewPurchasesStyles";

export function PurchaseSummaryPanel({ totalItems = 0, totalUnidades = 0, subtotal = 0 }) {
  const totalFinal = subtotal;

  return (
    <div className="bg-white rounded-xl border border-gray-200 border-l-[4px] border-l-[#2563eb] p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        
        {/* Cantidad de Items */}
        <div className="flex justify-between items-center">
          <span className="text-[13px] text-gray-500">Cantidad de Items</span>
          <span className="text-[13px] font-semibold text-gray-700">{totalItems} items</span>
        </div>

        {/* Cantidad Total de Productos */}
        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
          <span className="text-[13px] text-gray-500">Cantidad total</span>
          <span className="text-[13px] font-semibold text-gray-700">{totalUnidades} artículos</span>
        </div>

        {/* TOTAL FINAL */}
        <div className="flex justify-between items-end mt-2">
          <span className="text-sm font-bold text-gray-900 uppercase">Total</span>
          <span className="text-2xl font-black text-gray-900">
            $ {totalFinal.toLocaleString()}
          </span>
        </div>

      </div>
    </div>
  );
}