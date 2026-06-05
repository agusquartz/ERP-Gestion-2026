"use client";

import { formatCurrency } from "./utils";

export function PayrollDetailModal({ isOpen, onClose, employee }) {
  if (!isOpen || !employee) return null;

  // Tomamos las colecciones procesadas dinámicamente desde el hook
  const earnings = employee.earnings || [];
  const deductionItems = employee.deductionItems || [];

  const grossTotal = employee.grossIncome ?? 0;
  const deductionsTotal = employee.deductions ?? 0;
  const netTotal = employee.netIncome ?? 0;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
      <div className="w-full max-w-5xl rounded-lg bg-white shadow-xl border border-slate-200">

        {/* Header */}
        <div className="p-6 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">
            {employee.first_name} {employee.last_name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{employee.position}</p>
        </div>

        {/* Totales */}
        <div className="grid grid-cols-3 gap-4 px-6 pb-4">
          {/* Ingresos Totales */}
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Ingresos Totales (C)
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(grossTotal)}
            </p>
            <div className="mt-2 h-1 w-8 rounded-full bg-[#2b6df5]" />
          </div>

          {/* Deducciones Totales */}
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Deducciones Totales (D)
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(deductionsTotal)}
            </p>
            <div className="mt-2 h-1 w-8 rounded-full bg-red-400" />
          </div>

          {/* Pago Neto */}
          <div className="rounded-lg border border-[#2b6df5]/30 bg-[#f0f7ff] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#2b6df5] mb-1">
              Pago Neto
            </p>
            <p className="text-2xl font-bold text-[#2b6df5]">
              {formatCurrency(netTotal)}
            </p>
          </div>
        </div>

        {/* Detalle en dos columnas */}
        <div className="grid grid-cols-2 gap-0 border-t border-slate-200 mx-6 mb-4 max-h-[45vh] overflow-y-auto">
          
          {/* Columna Ingresos (Créditos 'C') */}
          <div className="pr-4 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#2b6df5] text-lg font-bold">⊕</span>
                <span className="font-bold text-slate-800 text-[14px]">Ingresos (Créditos)</span>
              </div>
              <span className="font-bold text-slate-800 text-[14px]">
                {formatCurrency(grossTotal)}
              </span>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="text-left font-semibold pb-2">Descripción</th>
                  <th className="text-center font-semibold pb-2">Unidades</th>
                  <th className="text-right font-semibold pb-2">Valor</th>
                  <th className="text-right font-semibold pb-2">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {earnings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                      Sin datos de ingresos aún.
                    </td>
                  </tr>
                ) : (
                  earnings.map((item, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-2 font-medium text-slate-800">{item.description}</td>
                      <td className="py-2 text-center text-slate-500">{item.quantity ?? "--"}</td>
                      <td className="py-2 text-right text-slate-600">{formatCurrency(item.unitAmount)}</td>
                      <td className="py-2 text-right font-semibold text-slate-900">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Columna Deducciones (Débitos 'D') */}
          <div className="border-l border-slate-200 pl-4 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-lg font-bold">⊖</span>
                <span className="font-bold text-slate-800 text-[14px]">Deducciones (Débitos)</span>
              </div>
              <span className="font-bold text-slate-800 text-[14px]">
                {formatCurrency(deductionsTotal)}
              </span>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="text-left font-semibold pb-2">Descripción</th>
                  <th className="text-center font-semibold pb-2">Unidades</th>
                  <th className="text-right font-semibold pb-2">Valor</th>
                  <th className="text-right font-semibold pb-2">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {deductionItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                      Sin datos de deducciones aún.
                    </td>
                  </tr>
                ) : (
                  deductionItems.map((item, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-2 font-medium text-slate-800">{item.description}</td>
                      <td className="py-2 text-center text-slate-500">{item.quantity ?? "--"}</td>
                      <td className="py-2 text-right text-slate-600">{formatCurrency(item.unitAmount)}</td>
                      <td className="py-2 text-right font-semibold text-red-600">-{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[5px] border border-slate-300 bg-white px-6 py-2 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}