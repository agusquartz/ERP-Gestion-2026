/**
 * @file QuotationModal.jsx
 * @module modules/purchases/modal/purchase-order
 *
 * @description
 * Modal for viewing and filling in a supplier's quotation response.
 */

"use client";

import { useState, useEffect } from "react";
import {
  btn,
  table,
  input,
  modal,
} from "../../styles/purchase-order/purchaseOrderStyles";

export default function QuotationModal({
  isOpen,
  supplier,
  orderItems,
  purchaseOrder,
  onClose,
  onSave,
  onPrint,
}) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (supplier) {
      setRows(
        supplier.quotationItems.map((qi) => ({
          ...qi,
          confirmedQty: qi.confirmedQty ?? 0,
          unitPrice: qi.unitPrice ?? 0,
        }))
      );
    }
  }, [supplier]);

  const isReadOnly = supplier?.status === "listo";

  if (!isOpen || !supplier) return null;

  const itemMap = Object.fromEntries(orderItems.map((item) => [item.id, item]));

  const handleChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: parseFloat(value) || 0 } : row
      )
    );
  };

  const handleSave = () => {
    onSave(supplier.id, rows);
    onClose();
  };

  return (
    <div className={modal.overlay}>
      <div className={`${modal.card} max-w-2xl shadow-panel`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        <div className="mb-6">
          <h2 className={modal.title}>
            Cotizacion{" "}
            <span className="text-primary">
              PC-#{purchaseOrder?.id?.replace("PC-", "")}
            </span>
          </h2>
          <p className="text-sm text-muted mt-1">
            <span className="font-semibold text-foreground">Proveedor:</span>{" "}
            {supplier.name}
          </p>
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">Enviado:</span>{" "}
            {purchaseOrder?.createdAt}
          </p>
        </div>

        <div className={modal.infoBanner}>
          <span className="mt-0.5 shrink-0">ℹ️</span>
          <span>
            Ingrese la cantidad confirmada y el precio unitario ofrecido por el
            proveedor.
          </span>
        </div>

        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
          Ítems Cotizados
        </p>

        <div className="rounded-lg border border-border overflow-x-auto">
          <table className={table.base}>
            <thead>
              <tr className={table.head}>
                <th className={`${table.th} w-8`}>#</th>
                <th className={table.th}>Código</th>
                <th className={table.th}>Producto</th>
                <th className={table.thCenter}>Cant. Solicitada</th>
                <th className={table.thCenter}>Cant. Confirmada</th>
                <th className={table.thCenter}>Precio Unit.</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const item = itemMap[row.orderItemId];
                if (!item) return null;

                return (
                  <tr key={row.orderItemId} className={table.row}>
                    <td className={table.tdMuted}>{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-muted text-xs">
                      {item.code}
                    </td>
                    <td className={table.td}>{item.product}</td>
                    <td className={table.tdCenter}>{item.quantity}</td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={row.confirmedQty}
                        onChange={(e) =>
                          handleChange(index, "confirmedQty", e.target.value)
                        }
                        readOnly={isReadOnly}
                        className={`w-20 ${
                          isReadOnly ? input.readOnly : input.editable
                        }`}
                      />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unitPrice}
                        onChange={(e) =>
                          handleChange(index, "unitPrice", e.target.value)
                        }
                        readOnly={isReadOnly}
                        className={`w-24 ${
                          isReadOnly ? input.readOnly : input.editable
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-right text-xs text-muted mt-2">
          Ítems: {String(rows.length).padStart(2, "0")}
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className={`${btn.secondary} shadow-panel`}>
            Atras
          </button>
          <button onClick={onPrint} className={`${btn.secondary} shadow-panel`}>
            Imprimir
          </button>
          {!isReadOnly && (
            <button onClick={handleSave} className={`${btn.primary} shadow-panel`}>
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
