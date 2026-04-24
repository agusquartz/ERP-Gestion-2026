"use client";

import { TrashIcon } from "@/shared/components/Icons";

export function PurchaseItemsTable({ items, onQtyChange, onRemove }) {
  const totalUnidades = items.reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0);

  return (
    <div className="flex flex-1 min-h-[380px] flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-9" />
            <col className="w-[130px] transition-all" />
            <col />
            <col className="w-[90px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-14" />
          </colgroup>

          <thead>
            <tr className="bg-background">
              {["#", "Código", "Descripción", "Cantidad", "Precio", "Subtotal", "Acción"].map((h) => (
                <th key={h} className="sticky top-0 border-b border-border bg-background px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="px-3 py-2.5 text-sm text-foreground">{i + 1}</td>
                <td className="px-3 py-2.5 text-sm text-foreground">{item.codigo}</td>
                <td className="truncate px-3 py-2.5 text-sm text-foreground" title={item.descripcion}>{item.descripcion}</td>
                <td className="px-3 py-2.5">
                  <input
                    type="number"
                    min={1}
                    value={item.cantidad}
                    onChange={(e) => onQtyChange(item.id, e.target.value)}
                    className="w-[60px] rounded-[5px] border border-border px-2 py-1 text-center text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </td>
                <td className="px-3 py-2.5 text-sm text-foreground">${item.precio}</td>
                <td className="px-3 py-2.5 text-sm text-foreground">${item.subtotal}</td>
                <td className="px-3 py-2.5">
                  <button type="button" onClick={() => onRemove(item.id)} className="inline-flex rounded-[5px] p-1 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive">
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Items: {items.length}</span>
        <span>Unidades totales: {totalUnidades}</span>
      </div>
    </div>
  );
}