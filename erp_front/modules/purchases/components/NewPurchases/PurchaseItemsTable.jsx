"use client";

import { TrashIcon, PackageIcon } from "@/shared/components/Icons";

export function PurchaseItemsTable({ items = [], onQtyChange, onRemove }) {
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Contenedor con scroll: La clave es 'overflow-auto' aquí */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full border-collapse">
          <thead>
            {/* 'sticky top-0' mantiene la cabecera fija arriba mientras haces scroll */}
            <tr className="sticky top-0 z-10 bg-[#f8fafc] border-b border-gray-200">
              {/* Bajamos el padding (py-2) para que sea más fina */}
              <th className="w-10 px-4 py-2 text-left text-[11px] font-bold text-slate-500 uppercase">#</th>
              <th className="w-24 px-2 py-2 text-left text-[11px] font-bold text-slate-500 uppercase">Codigo</th>
              <th className="px-2 py-2 text-left text-[11px] font-bold text-slate-500 uppercase">Producto</th>
              <th className="w-32 px-2 py-2 text-left text-[11px] font-bold text-slate-500 uppercase">Categoria</th>
              <th className="w-20 px-2 py-2 text-left text-[11px] font-bold text-slate-500 uppercase">Cant</th>
              <th className="w-24 px-2 py-2 text-left text-[11px] font-bold text-slate-500 uppercase">Precio</th>
              <th className="w-24 px-2 py-2 text-left text-[11px] font-bold text-slate-500 uppercase">Sub Total</th>
              <th className="w-16 px-2 py-2 text-center text-[11px] font-bold text-slate-500 uppercase">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                <td className="px-2 py-3 text-sm font-medium text-gray-700">{item.codigo}</td>
                <td className="px-2 py-3 text-sm text-gray-600 truncate">{item.descripcion}</td>
                <td className="px-2 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                    {item.categoria}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) => onQtyChange(item.id, e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-center focus:ring-0 outline-none"
                  />
                </td>
                <td className="px-2 py-3 text-sm text-gray-600">${item.precio}</td>
                <td className="px-2 py-3 text-sm font-semibold text-gray-800">${item.subtotal}</td>
                <td className="px-2 py-3 text-center">
                  <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-500">
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
