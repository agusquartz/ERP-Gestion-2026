"use client";

import { useEffect, useMemo, useState } from "react";

export default function SupplierQuotationModal({
  supplier,
  isOpen,
  readonly,
  onClose,
  onSave,
  onPrint,
}) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!supplier) return;
    setRows(
      (supplier.quotationItems ?? []).map((qi) => ({
        orderItemId: qi.orderItemId ?? qi.productId,
        productId: qi.productId,
        code: qi.code ?? "",
        product: qi.product ?? String(qi.productId),
        category: qi.category ?? "",
        requestedQty: qi.requestedQty ?? 0,
        confirmedQty: qi.confirmedQty ?? 0,
        unitPrice: qi.unitPrice ?? 0,
        excluded: qi.excluded ?? false,
      }))
    );
  }, [supplier]);

  const discardAll = useMemo(
    () => rows.length > 0 && rows.every((r) => r.excluded),
    [rows]
  );

  function toggleDiscardAll(value) {
    setRows((prev) => prev.map((row) => ({ ...row, excluded: value })));
  }

  function toggleRow(index) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, excluded: !row.excluded } : row))
    );
  }

  function handleChange(index, field, value) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function handleSave() {
    const activeRows = rows.filter((r) => !r.excluded);
    const isComplete =
      activeRows.length > 0 &&
      activeRows.every((r) => Number(r.confirmedQty) > 0 && Number(r.unitPrice) > 0);
    onSave(supplier.id, rows, isComplete);
    onClose();
  }

  function handlePrint() {
    onPrint(supplier.id);
  }

  if (!isOpen || !supplier) return null;

  const visibleRows = rows.filter((r) => !r.excluded);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="relative bg-surface rounded-xl w-full mx-4 p-8 max-w-4xl w-full shadow-panel max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">Cotización</h2>
          <p className="text-sm text-muted mt-1">
            <span className="font-semibold text-foreground">Proveedor:</span>{" "}
            {supplier.name}
          </p>
          {supplier.createdAt && (
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">Fecha:</span>{" "}
              {supplier.createdAt}
            </p>
          )}
        </div>

        {/* Info banner */}
        {!readonly && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6 text-sm text-blue-700">
            <span className="shrink-0">ℹ️</span>
            <span>
              Ingresá la cantidad confirmada y el precio unitario ofrecido por el proveedor.
            </span>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">
              Ítems Cotizados
            </p>
            {!readonly && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discardAll}
                  onChange={(e) => toggleDiscardAll(e.target.checked)}
                />
                <span className="text-xs font-semibold text-muted uppercase tracking-widest">
                  Descartar todos
                </span>
              </label>
            )}
          </div>

          <div className="rounded-lg border border-border overflow-y-auto max-h-64">
            <table className="w-full text-sm w-full table-fixed">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-border/40 text-muted text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left text-foreground w-8">#</th>
                  <th className="px-4 py-3 text-left text-foreground">Código</th>
                  <th className="px-4 py-3 text-left text-foreground">Producto</th>
                  <th className="px-4 py-3 text-center text-foreground">Cant. Solicitada</th>
                  <th className="px-4 py-3 text-center text-foreground">Cant. Confirmada</th>
                  <th className="px-4 py-3 text-center text-foreground">Precio Unit.</th>
                  {!readonly && <th className={`${table.thCenter} w-16`}>Desc.</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.productId}
                    className={`border-t border-border hover:bg-gray-50/60 transition-colors ${row.excluded ? "opacity-50 bg-gray-50" : ""}`}
                  >
                    <td className="px-4 py-3 text-muted">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {row.code}
                    </td>
                    <td className={`px-4 py-3 text-foreground ${row.excluded ? "line-through" : ""}`}>
                      {row.product}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground">{row.requestedQty}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={row.confirmedQty}
                        onChange={(e) => handleChange(index, "confirmedQty", e.target.value)}
                        readOnly={readonly || row.excluded}
                        className={`w-20 ${readonly || row.excluded ? input.readOnly : input.editable}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unitPrice}
                        onChange={(e) => handleChange(index, "unitPrice", e.target.value)}
                        readOnly={readonly || row.excluded}
                        className={`w-24 ${readonly || row.excluded ? input.readOnly : input.editable}`}
                      />
                    </td>
                    {!readonly && (
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.excluded}
                          onChange={() => toggleRow(index)}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-right text-xs text-muted mt-2">
            Ítems activos: {String(visibleRows.length).padStart(2, "0")}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-[#F2F3F7] transition-colors shadow-panel">
            Atrás
          </button>
          {!readonly && (
            <>
              <button onClick={handlePrint} className="px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-[#F2F3F7] transition-colors shadow-panel">
                Imprimir
              </button>
              <button onClick={handleSave} className="px-5 py-2 text-sm font-semibold rounded-[5px] bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Guardar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}