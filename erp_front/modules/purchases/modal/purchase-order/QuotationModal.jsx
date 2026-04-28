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
    if (!supplier) return;

    //1. Filter items by supplier category. 
    const itemsForSupplier = orderItems.filter(item => 
      supplier.categories?.includes(item.category)
    );

    //2. Build rows by combining with quotation items(If they exist)
    const buildRows = itemsForSupplier.map(item => {
      const existing = supplier.quotationItems?.find(
        qi => qi.orderItemId === item.id
      );

      return {
        orderItemId: item.id,
        confirmedQty: existing?.confirmedQty ?? 0,
        unitPrice: existing?.unitPrice ?? 0,
        excluded: existing?.excluded ?? false,
      };
    }); 

    setRows(buildRows);
  }, [supplier, orderItems]);

  const isReadOnly = supplier?.status === "reading";

  if (!isOpen || !supplier) return null;

  const itemMap = Object.fromEntries(orderItems.map((item) => [item.id, item]));

  const visibleRows = rows.filter((row) => !row.excluded);

  const handleChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: parseFloat(value) || 0 } : row
      )
    );
  };

  const handleToggleExcluded = (index) => {
    setRows((prev) => 
      prev.map((row, i) =>
        i === index ? { ...row, excluded: !row.excluded } : row
      )
    );
  };

  const handleSave = () => {
    // We only send active rows
    const rowsToSend = rows.filter((row) => !row.excluded);

    // A row is complete if it has quantity and price 
    const isComplete = 
      rowsToSend.length > 0 &&
      rowsToSend.every(
        (row) => Number(row.confirmedQty) > 0 && Number(row.unitPrice) > 0
      );
    onSave(supplier.id, rowsToSend, isComplete);
    onClose();
  };

  const handlePrintClick = () => {
    onPrint(supplier.id);
  };

  return (
    <div className={modal.overlay}>
      <div className={`${modal.card} max-w-4xl w-full shadow-panel max-h-[85vh] flex flex-col`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        <div className="mb-6 print:hidden">
          <h2 className={modal.title}>
            Cotizacion{" "}
            <span className="text-primary">
              PC-#{purchaseOrder?.id}
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

        <div className={`${modal.infoBanner} print:hidden`}>
          <span className="mt-0.5 shrink-0">ℹ️</span>
          <span>
            Ingrese la cantidad confirmada y el precio unitario ofrecido por el
            proveedor. Puede excluir filas con el checkbox.
          </span>
        </div>

        <div className="print:hidden">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
            Ítems Cotizados
          </p>

          <div className="rounded-lg border border-border overflow-y-auto max-h-64">
            <table className={`${table.base} w-full table-fixed`}>
              <thead className="sticky top-0 bg-white z-10">
                <tr className={table.head}>
                  <th className={`${table.th} w-8`}>#</th>
                  <th className={table.th}>Código</th>
                  <th className={table.th}>Producto</th>
                  <th className={table.thCenter}>Cant. Solicitada</th>
                  <th className={table.thCenter}>Cant. Confirmada</th>
                  <th className={table.thCenter}>Precio Unit.</th>
                  <th className={`${table.thCenter} w-16`}>Desc.</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => {
                  const item = itemMap[row.orderItemId];
                  if (!item) return null;

                  return (
                    <tr key={row.orderItemId} className={`${table.row} ${row.excluded ? "opacity-50 bg-gray-50 line-through" : ""}`}>
                      <td className={table.tdMuted}>{index + 1}</td>
                      <td className="px-4 py-3 font-mono text-muted text-xs">
                        {item.product_code}
                      </td>
                      <td className={`${table.td} whitespace-normal break-words`}>{item.product_name}</td>
                      <td className={table.tdCenter}>{item.quantity}</td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={row.confirmedQty}
                          onChange={(e) =>
                            handleChange(index, "confirmedQty", e.target.value)
                          }
                          readOnly={isReadOnly || row.excluded}
                          className={`w-20 ${
                            isReadOnly || row.excluded ? input.readOnly : input.editable
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
                          readOnly={isReadOnly || row.excluded}
                          className={`w-24 ${
                            isReadOnly || row.excluded ? input.readOnly : input.editable
                          }`}
                        />
                      </td>

                      <td className="px-4 py-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={row.excluded}
                          onChange={() => handleToggleExcluded(index)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <p className="text-right text-xs text-muted mt-2">
            Ítems activos: {String(visibleRows.length).padStart(2, "0")}
          </p>
        </div>

        {/* Print view: only Code, Product and Quantity requested */}
        <div className="hidden print:block">
          <table className={table.base}>
            <thead>
              <tr className={table.head}>
                <th className={table.th}>Código</th>
                <th className={table.th}>Producto</th>
                <th className={table.thCenter}>Cant. Solicitada</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => {
                const item = itemMap[row.orderItemId];
                if (!item) return null;

                return (
                  <tr key={row.orderItemId} className={table.row}>
                    <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                    <td className={table.td}>{item.product}</td>
                    <td className={table.tdCenter}>{item.quantity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 mt-6 print:hidden">

          <button 
            onClick={onClose}
            className={`${btn.secondary} shadow-panel`}
          >
            Atras
          </button>

          <button 
            onClick={handlePrintClick}
            className={`${btn.secondary} shadow-panel`}
          >
            Imprimir
          </button>

          {!isReadOnly && (
            <button 
              onClick={handleSave}
              className={`${btn.primary} shadow-panel`}
            >
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
