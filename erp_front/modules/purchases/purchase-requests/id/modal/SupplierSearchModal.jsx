"use client";

import { useEffect, useMemo, useState } from "react";

export default function SupplierSearchModal({
  isOpen,
  categoryNames = [],   
  categoryIds = [],     
  onClose,
  onSearchSuppliers,
  onConfirm,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Deduplicar nombres para los badges
  const normalizedNames = useMemo(
    () => [...new Set(categoryNames)].filter(Boolean),
    [categoryNames]
  );

  // Deduplicar IDs para el fetch
  const normalizedIds = useMemo(
    () => [...new Set(categoryIds)].filter((id) => id !== null && id !== undefined),
    [categoryIds]
  );

  useEffect(() => {
    if (!isOpen) return;

    async function fetchSuppliers() {
      setLoadingSuppliers(true);
      setSelectedIds(new Set());
      setSearchQuery("");

      try {
        // Usa IDs numéricos — lo que getSuppliers() espera
        const data = await onSearchSuppliers({
          contains: "",
          categories: normalizedIds,
        });

        setAvailableSuppliers(data ?? []);
      } catch (err) {
        console.error("Error fetching available suppliers:", err);
        setAvailableSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    }

    fetchSuppliers();
  }, [isOpen, normalizedIds, onSearchSuppliers]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableSuppliers;
    return availableSuppliers.filter((s) =>
      (s.name ?? "").toLowerCase().includes(q)
    );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="relative bg-surface rounded-xl w-full mx-4 p-8 max-w-lg shadow-panel">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Agregar Proveedor</h2>
          <p className="text-sm text-muted mt-1">
            Proveedores disponibles para las categorías de este pedido.
          </p>

          {/* Badges visuales — usan nombres, no IDs */}
          <div className="flex flex-wrap gap-1 mt-2">
            {normalizedNames.map((name) => (
              <span key={name} className="px-2 py-0.5 rounded-full bg-border/60 text-muted text-xs font-medium uppercase tracking-wide">
                {name}
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
            className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
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
                    selectedIds.has(supplier.id) ? "bg-blue-50" : "hover:bg-gray-50"
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
                      {supplier.categories?.map((cat) => {
                        const label = typeof cat === "string" ? cat : cat?.name;
                        if (!label) return null;
                        return (
                          <span key={label} className="px-2 py-0.5 rounded-full bg-border/60 text-muted text-xs font-medium uppercase tracking-wide">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-muted mb-4">
          {selectedIds.size > 0
            ? `${selectedIds.size} proveedor${selectedIds.size > 1 ? "es" : ""} seleccionado${selectedIds.size > 1 ? "s" : ""}`
            : "Ningún proveedor seleccionado"}
        </p>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-gray-50 transition-colors shadow-panel">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors shadow-panel disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar Seleccionados ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
}