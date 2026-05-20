// modules/purchases/purchase-requests/analysis/components/SelectSupplierModal.jsx
"use client";

import { useState, useEffect } from "react";

export function SelectSupplierModal({
  product,
  requestedQty,
  quotes,
  currentSupplierId,
  onSelect,
  onClose,
}) {
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const opts = [];
    for (const quote of quotes) {
      const detail = quote.details?.find((d) => d.productId === product.id);
      // Solo incluir si tiene unitCost (proveedor respondió)
      if (detail && detail.unitCost != null && quote.supplier?.id) {
        opts.push({
          supplierId: quote.supplier.id,
          supplierName: quote.supplier.name,
          unitCost: parseFloat(detail.unitCost),
          confirmedQuantity: detail.confirmedQuantity ?? 0,
        });
      }
    }
    // Ordenar por precio ascendente — más barato primero
    opts.sort((a, b) => a.unitCost - b.unitCost);
    setOptions(opts);

    // Preseleccionar: el actual si existe, si no el más barato
    if (currentSupplierId) {
      setSelectedId(currentSupplierId);
    } else if (opts.length > 0) {
      setSelectedId(opts[0].supplierId);
    }
  }, [product, quotes, currentSupplierId]);

  const handleConfirm = () => {
    if (selectedId) onSelect(selectedId);
    else onClose();
  };

  // Badge de disponibilidad basado en confirmedQuantity vs requestedQty
  function AvailabilityBadge({ confirmed, requested }) {
    if (confirmed >= requested) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
          Disponible
        </span>
      );
    }
    if (confirmed > 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-300">
          Parcial
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        Sin stock
      </span>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="relative bg-surface rounded-xl w-full max-w-2xl mx-4 shadow-xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-2xl font-bold text-foreground">Seleccionar Proveedor</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* ── Product info ── */}
        <div className="px-6 py-4 border-b border-border bg-gray-50">
          <div className="flex items-start gap-6 flex-wrap">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Código</p>
              <p className="text-sm font-mono text-foreground mt-0.5">{product.code}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted uppercase tracking-wider">Descripción</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{product.description}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Cant. Solicitada</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{requestedQty}</p>
            </div>
          </div>
          <p className="text-xs text-muted italic mt-3">
            Ordenado por disponibilidad de stock y menor precio.
          </p>
        </div>

        {/* ── Tabla de proveedores ── */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
            Selección de proveedores
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-muted text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 text-left w-8">#</th>
                  <th className="px-4 py-2 text-left">Proveedor</th>
                  <th className="px-4 py-2 text-right">Precio Unit.</th>
                  <th className="px-4 py-2 text-right">Cant. Disponible</th>
                  <th className="px-4 py-2 text-center">Disponibilidad</th>
                </tr>
              </thead>
              <tbody>
                {options.map((opt, index) => (
                  <tr
                    key={opt.supplierId}
                    onClick={() => setSelectedId(opt.supplierId)}
                    className={`border-t border-border cursor-pointer transition-colors ${
                      selectedId === opt.supplierId
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-muted text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {opt.supplierName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {opt.unitCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {opt.confirmedQuantity}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AvailabilityBadge
                        confirmed={opt.confirmedQuantity}
                        requested={requestedQty}
                      />
                    </td>
                  </tr>
                ))}
                {options.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted">
                      No hay cotizaciones disponibles para este producto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-gray-50 transition-colors shadow-panel">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || options.length === 0}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors shadow-panel disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Seleccionar
          </button>
        </div>
      </div>
    </div>
  );
}