"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * -----------------------------------------------------------------------------
 * SupplierSearchModal Component
 * -----------------------------------------------------------------------------
 *
 * This modal allows the user to search and select suppliers that can be added
 * to the current purchase request.
 *
 * Main responsibilities:
 * - Load available suppliers when the modal opens.
 * - Filter suppliers by text search.
 * - Display supplier categories as badges.
 * - Allow single or multiple selection.
 * - Confirm the selected suppliers back to the parent component.
 *
 * Props:
 * -----------------------------------------------------------------------------
 * @param {boolean} isOpen
 * Controls whether the modal is visible or not.
 *
 * @param {Array<string>} categoryNames
 * Category labels shown as visual badges in the modal.
 * These are used for display only.
 *
 * @param {Array<number|string>} categoryIds
 * Category IDs used for searching suppliers from the backend.
 *
 * @param {Function} onClose
 * Callback executed when the modal should close.
 *
 * @param {Function} onSearchSuppliers
 * Async callback used to fetch suppliers from the backend.
 * Expected signature:
 * ({ contains, categories }) => Promise<Array>
 *
 * @param {Function} onConfirm
 * Callback executed when the user confirms the selected suppliers.
 * Receives:
 * (selectedSuppliers) => void
 *
 * Return:
 * -----------------------------------------------------------------------------
 * - Returns null when the modal is closed.
 * - Otherwise returns a full-screen overlay with:
 *   - title
 *   - search input
 *   - supplier list
 *   - selection counter
 *   - confirm/cancel actions
 * -----------------------------------------------------------------------------
 */
export default function SupplierSearchModal({
  isOpen,
  categoryNames = [],
  categoryIds = [],
  onClose,
  onSearchSuppliers,
  onConfirm,
}) {
  /**
   * Current text used to filter suppliers locally.
   */
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Set of selected supplier IDs.
   *
   * A Set is used here because it provides efficient add/remove/check logic.
   */
  const [selectedIds, setSelectedIds] = useState(new Set());

  /**
   * Full supplier list returned by the API.
   */
  const [availableSuppliers, setAvailableSuppliers] = useState([]);

  /**
   * Loading indicator while suppliers are being fetched.
   */
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  /**
   * Deduplicated category names for display badges.
   */
  const normalizedNames = useMemo(
    () => [...new Set(categoryNames)].filter(Boolean),
    [categoryNames]
  );

  /**
   * Deduplicated category IDs for backend queries.
   *
   * Null/undefined IDs are removed because the search API expects valid IDs.
   */
  const normalizedIds = useMemo(
    () =>
      [...new Set(categoryIds)].filter(
        (id) => id !== null && id !== undefined
      ),
    [categoryIds]
  );

  /**
   * Fetch suppliers every time the modal opens.
   *
   * The state is reset on open so the user always sees a fresh selection flow.
   */
  useEffect(() => {
    if (!isOpen) return;

    async function fetchSuppliers() {
      setLoadingSuppliers(true);
      setSelectedIds(new Set());
      setSearchQuery("");

      try {
        /**
         * Query the parent-provided search function.
         *
         * The current implementation searches by category IDs and text.
         */
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

  /**
   * Locally filters suppliers by text input.
   *
   * This does not re-query the backend; it only filters the current list.
   */
  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableSuppliers;

    return availableSuppliers.filter((s) =>
      (s.name ?? "").toLowerCase().includes(q)
    );
  }, [availableSuppliers, searchQuery]);

  /**
   * Do not render anything when the modal is closed.
   */
  if (!isOpen) return null;

  /**
   * Toggles one supplier in the selected Set.
   *
   * @param {number|string} id
   */
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /**
   * Selects or deselects all suppliers currently visible in the filtered list.
   */
  const toggleAll = () => {
    const allFilteredIds = filteredSuppliers.map((s) => s.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(allFilteredIds));
  };

  /**
   * Sends the selected suppliers back to the parent component.
   */
  const handleConfirm = () => {
    const selected = availableSuppliers.filter((s) => selectedIds.has(s.id));
    onConfirm(selected);
  };

  /**
   * Indicates whether every currently filtered supplier is selected.
   */
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

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Agregar Proveedor
          </h2>
          <p className="text-sm text-muted mt-1">
            Proveedores disponibles para las categorías de este pedido.
          </p>

          {/* Category badges shown as visual context only */}
          <div className="flex flex-wrap gap-1 mt-2">
            {normalizedNames.map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 rounded-full bg-border/60 text-muted text-xs font-medium uppercase tracking-wide"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>

        {/* Supplier results panel */}
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

          {/* Loading state */}
          {loadingSuppliers && (
            <div className="px-4 py-6 text-center text-sm text-muted">
              Cargando proveedores...
            </div>
          )}

          {/* Empty state */}
          {!loadingSuppliers && filteredSuppliers.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted">
              No se encontraron proveedores.
            </div>
          )}

          {/* Supplier list */}
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

                    {/* Supplier category badges */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {supplier.categories?.map((cat) => {
                        const label =
                          typeof cat === "string" ? cat : cat?.name;
                        if (!label) return null;

                        return (
                          <span
                            key={label}
                            className="px-2 py-0.5 rounded-full bg-border/60 text-muted text-xs font-medium uppercase tracking-wide"
                          >
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

        {/* Selection summary */}
        <p className="text-xs text-muted mb-4">
          {selectedIds.size > 0
            ? `${selectedIds.size} proveedor${
                selectedIds.size > 1 ? "es" : ""
              } seleccionado${selectedIds.size > 1 ? "s" : ""}`
            : "Ningún proveedor seleccionado"}
        </p>

        {/* Footer actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-gray-50 transition-colors shadow-panel"
          >
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