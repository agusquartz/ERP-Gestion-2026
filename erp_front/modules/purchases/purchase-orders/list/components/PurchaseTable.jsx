import React from "react";
import { Eye } from "lucide-react";

import {
  formatDate,
  translateOrderStatusName,
} from "../components/utils.js";

const PurchaseTable = ({ data = [], totalResults = 0, onView }) => {
  const filteredResults = data.length;

  const getStatusStyles = (status) => {
    const s = status?.toLowerCase();

    if (s === "pending" || s === "unsent") {
      return "bg-[#FFE6E5] text-[#5D0000] border-[#91372B]";
    }

    if (s === "partial") {
      return "bg-[#FFFDE5] text-[#5D5200] border-[#FFE44A]";
    }

    if (s === "completed" || s === "ok") {
      return "bg-[#E5EAFF] text-[#00085D] border-[#4A83FF]";
    }

    return "bg-[#DADADA] text-[#374151] border-[#476559]";
  };

  const headers = [
    "Orden Nro.",
    "Proveedor",
    "Fecha",
    "Pedido Nro.",
    "Estado",
    "Acción",
  ];

  return (
    // CAMBIO: mismo contenedor visual que OrderTable.
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      {/* CAMBIO: scroll interno para que la tabla no rompa el layout. */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-fixed border-collapse">
          {/* CAMBIO: anchos controlados como OrderTable. */}
          <colgroup>
            <col className="w-[140px]" />
            <col />
            <col className="w-[140px]" />
            <col className="w-[140px]" />
            <col className="w-[150px]" />
            <col className="w-[120px]" />
          </colgroup>

          <thead>
            <tr className="bg-background">
              {headers.map((h, idx) => (
                <th
                  key={h}
                  className={`sticky top-0 border-b border-border bg-background px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                    idx === 0 || idx === 1 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="group border-b border-gray-100 hover:bg-[#f0f7ff] transition-colors cursor-pointer"
              >
                <td className="px-4 py-3.5 text-sm font-bold text-[#2b6df5] text-left">
                  {item.id}
                </td>

                <td className="truncate px-4 py-3.5 text-sm font-medium text-foreground text-left">
                  {item.supplier?.name}
                </td>

                <td className="px-4 py-3.5 text-sm text-foreground text-right">
                  {formatDate(item.createdAt)}
                </td>

                <td className="px-4 py-3.5 text-sm text-foreground text-right">
                  {item.purchaseRequestId}
                </td>

                <td className="px-4 py-3.5 text-right">
                  <div className="flex justify-end">
                    <span
                      className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[10px] font-bold w-[90px] justify-center ${getStatusStyles(
                        item.status?.name
                      )}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                      {translateOrderStatusName(item.status?.name)}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3.5 text-right">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onView(item.id)}
                      className="inline-flex rounded-[5px] p-1 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="py-9 text-center text-sm text-muted-foreground"
                >
                  No hay órdenes de compra disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CAMBIO: footer igual al estilo de OrderTable. */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>
          Mostrando {filteredResults} de {totalResults} resultados
        </span>
      </div>
    </div>
  );
};

export default PurchaseTable;