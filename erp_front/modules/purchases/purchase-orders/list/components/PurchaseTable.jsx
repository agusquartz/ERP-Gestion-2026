import React from "react";
import { Eye } from "lucide-react";

import {
  formatDate,
  translateOrderStatusName,
} from "../components/utils.js";

const PurchaseTable = ({ data = [], totalResults = 0, onView }) => {
  const filteredResults = data.length;

  const getStatusStyles = (status) => {
    const s = String(status || "").toLowerCase();

    if (
      s === "completed" ||
      s === "ok" ||
      s === "paid" ||
      s === "pagado" ||
      s === "completado"
    ) {
      return {
        border: "border-success",
        bg: "bg-success/10",
        text: "text-success",
        dot: "bg-success",
      };
    }

    if (
      s === "pending" ||
      s === "unsent" ||
      s === "pendiente" ||
      s === "created"
    ) {
      return {
        border: "border-destructive",
        bg: "bg-destructive/10",
        text: "text-destructive",
        dot: "bg-destructive",
      };
    }

    if (
      s === "partial" ||
      s === "parcial"
    ) {
      return {
        border: "border-warning",
        bg: "bg-warning/10",
        text: "text-warning",
        dot: "bg-warning",
      };
    }

    if (
      s === "cancelled" ||
      s === "canceled" ||
      s === "anulado" ||
      s === "cancelado"
    ) {
      return {
        border: "border-muted",
        bg: "bg-muted/10",
        text: "text-muted-foreground",
        dot: "bg-muted-foreground",
      };
    }

    return {
      border: "border-muted",
      bg: "bg-muted/10",
      text: "text-muted-foreground",
      dot: "bg-muted-foreground",
    };
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
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-fixed border-collapse">
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
                  className={`sticky top-0 z-10 border-b border-border bg-background px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                    idx === 0 || idx === 1 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((item) => {
              const { border, bg, text, dot } = getStatusStyles(item.status?.name);

              return (
                <tr
                  key={item.id}
                  className="group border-b border-gray-100 hover:bg-[#f0f7ff] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3.5 text-sm font-bold text-[#2b6df5] text-left">
                    {item.id}
                  </td>

                  <td
                    className="truncate px-4 py-3.5 text-sm font-medium text-foreground text-left"
                    title={item.supplier?.name}
                  >
                    {item.supplier?.name || "Sin proveedor"}
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
                        className={`inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-bold ${border} ${bg} ${text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
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
              );
            })}

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

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>
          Mostrando {filteredResults} de {totalResults} resultados
        </span>
      </div>
    </div>
  );
};

export default PurchaseTable;