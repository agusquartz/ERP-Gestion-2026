/**
 * @file SupplierSearchModal.jsx
 * @module modules/purchases/purchase-requests/id/modal
 *
 * @description
 * Modal for searching and selecting suppliers to add to a purchase order.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  btn,
  input,
  modal,
  badge,
} from "../styles/purchaseRequestsStyles";
import { getAvailableSuppliers } from "../services/purchaseRequestsService";

export default function SupplierSearchModal({
  isOpen,
  categoryNames = [],
  orderId,
  alreadyAdded = [],
  onClose,
  onConfirm,
}) {
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    if (!isOpen) return;

    async function fetchSuppliers() {
      setLoadingSuppliers(true);
      setSelectedIds(new Set());
      setSearchQuery("");

      try {
        const data = await getAvailableSuppliers(categoryNames);
        setAvailableSuppliers(data.filter((s) => !alreadyAdded.includes(s.id)));
      } catch (err) {
        console.error("Error fetching available suppliers:", err);
      } finally {
        setLoadingSuppliers(false);
      }
    }

    fetchSuppliers();
  }, [isOpen, orderId, categoryNames, alreadyAdded]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableSuppliers;
    return availableSuppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [availableSuppliers, searchQuery]);

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const allFilteredIds = filteredSuppliers.map((s) => s.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(allFilteredIds));
  };

  const handleConfirm = () => {
    const selected = availableSuppliers.filter((s) => selectedIds.has(s.id));
    onConfirm(selected);
  };

  const allFilteredSelected =
    filteredSuppliers.length > 0 &&
    filteredSuppliers.every((s) => selectedIds.has(s.id));

  return (
    <div className={modal.overlay}>
      <div className={`${modal.card} max-w-lg shadow-panel`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        <div className="mb-6">
          <h2 className={modal.title}>Agregar Proveedor</h2>
          <p className="text-sm text-muted mt-1">
            Proveedores disponibles para las categorías de este pedido.
          </p>

          <div className="flex flex-wrap gap-1 mt-2">
            {categoryNames.map((cat) => (
              <span key={cat} className={badge.category}>
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={input.search}
          />
        </div>

        <div className="border border-border rounded-lg overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-border/30 border-b border-border">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAll}
              className="accent-primary w-4 h-4 cursor-pointer"
              aria-label="Seleccionar todos"
            />
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">
              Seleccionar todos ({filteredSuppliers.length})
            </span>
          </div>

          {loadingSuppliers && (
            <div className="px-4 py-6 text-center text-sm text-muted">
              Cargando proveedores...
            </div>
          )}

          {!loadingSuppliers && filteredSuppliers.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted">
              No se encontraron proveedores.
            </div>
          )}

          {!loadingSuppliers && (
            <ul className="divide-y divide-border max-h-64 overflow-y-auto">
              {filteredSuppliers.map((supplier) => (
                <li
                  key={supplier.id}
                  onClick={() => toggleSelect(supplier.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selectedIds.has(supplier.id)
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(supplier.id)}
                    onChange={() => toggleSelect(supplier.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-primary w-4 h-4 cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {supplier.name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {supplier.categories?.map((cat) => (
                        <span key={cat} className={badge.category}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-muted mb-4">
          {selectedIds.size > 0
            ? `${selectedIds.size} proveedor${
                selectedIds.size > 1 ? "es" : ""
              } seleccionado${selectedIds.size > 1 ? "s" : ""}`
            : "Ningún proveedor seleccionado"}
        </p>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={`${btn.secondary} shadow-panel`}>
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className={`${btn.primary} shadow-panel disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Agregar Seleccionados ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
}
