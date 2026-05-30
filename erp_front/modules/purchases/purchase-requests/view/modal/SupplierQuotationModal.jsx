"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * -----------------------------------------------------------------------------
 * SupplierQuotationModal Component
 * -----------------------------------------------------------------------------
 *
 * This modal is used to display and edit the quotation of a single supplier.
 *
 * Main responsibilities:
 * - Show supplier quotation data in a table format.
 * - Allow editing of confirmed quantities and unit prices.
 * - Allow discarding individual rows or all rows at once.
 * - Calculate whether the quotation is complete.
 * - Trigger save and print actions.
 * - Respect read-only mode when the quotation should not be edited.
 *
 * Props:
 * -----------------------------------------------------------------------------
 * @param {Object|null} supplier
 * The supplier quotation data currently being edited or viewed.
 * Expected structure:
 * {
 *   id: number|string,
 *   name: string,
 *   createdAt?: string,
 *   quotationItems?: Array<{
 *     orderItemId?: number|string,
 *     productId: number|string,
 *     code?: string,
 *     product?: string,
 *     category?: string,
 *     requestedQty?: number,
 *     confirmedQty?: number,
 *     unitPrice?: number,
 *     excluded?: boolean
 *   }>
 * }
 *
 * @param {boolean} isOpen
 * Controls whether the modal is visible or not.
 *
 * @param {boolean} readonly
 * If true, the modal becomes view-only:
 * - inputs are disabled
 * - discard controls are hidden
 * - only navigation actions remain available
 *
 * @param {Function} onClose
 * Callback executed when the modal must be closed.
 *
 * @param {Function} onSave
 * Callback executed when the user saves changes.
 * Signature:
 * (quoteId, rows, isComplete) => void
 *
 * @param {Function} onPrint
 * Callback executed when the user prints the quotation.
 * Signature:
 * (quoteId) => void
 *
 * Return:
 * -----------------------------------------------------------------------------
 * - Returns null when the modal is closed or no supplier exists.
 * - Otherwise returns a full-screen overlay modal with:
 *   - header
 *   - quotation items table
 *   - footer actions
 * -----------------------------------------------------------------------------
 */
export default function SupplierQuotationModal({
  supplier,
  isOpen,
  readonly,
  onClose,
  onSave,
  onPrint,
}) {
  /**
   * Local editable copy of the supplier quotation rows.
   *
   * This state is initialized from the supplier prop so the user can edit
   * values without mutating the original data directly.
   */
  const [rows, setRows] = useState([]);

  /**
   * Synchronizes local rows whenever the supplier changes.
   *
   * This is important because:
   * - opening the modal with a different supplier should refresh the table
   * - loaded quotation data must be reflected in local editable state
   */
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

  /**
   * Determines whether all rows are currently discarded.
   *
   * This is used to control the "discard all" checkbox.
   */
  const discardAll = useMemo(
    () => rows.length > 0 && rows.every((r) => r.excluded),
    [rows]
  );

  /**
   * Marks every row as discarded or active.
   *
   * @param {boolean} value
   * true  -> discard all rows
   * false -> restore all rows
   */
  function toggleDiscardAll(value) {
    setRows((prev) => prev.map((row) => ({ ...row, excluded: value })));
  }

  /**
   * Toggles the discarded state for a single row.
   *
   * @param {number} index
   * Row index in the local array.
   */
  function toggleRow(index) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, excluded: !row.excluded } : row
      )
    );
  }

  /**
   * Updates one field of a given row.
   *
   * This is used for editable numeric inputs such as:
   * - confirmedQty
   * - unitPrice
   *
   * @param {number} index
   * Row index.
   * @param {string} field
   * Field name to update.
   * @param {any} value
   * New field value.
   */
  function handleChange(index, field, value) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  /**
   * Builds the save payload logic and sends current local rows upward.
   *
   * The component calculates completeness before saving:
   * - there must be at least one active row
   * - all active rows must have confirmedQty > 0
   * - all active rows must have unitPrice > 0
   *
   * Then it calls onSave with:
   * - supplier.id
   * - current rows
   * - isComplete flag
   *
   * Finally it closes the modal.
   */
  function handleSave() {
    const activeRows = rows.filter((r) => !r.excluded);

    const isComplete =
      activeRows.length > 0 &&
      activeRows.every(
        (r) => Number(r.confirmedQty) > 0 && Number(r.unitPrice) > 0
      );

    onSave(supplier.id, rows, isComplete);
    onClose();
  }

  /**
   * Triggers printing for the current supplier quotation.
   */
  function handlePrint() {
    onPrint(supplier.id);
  }

  /**
   * Do not render anything unless the modal is open and a supplier exists.
   */
  if (!isOpen || !supplier) return null;

  /**
   * Rows that are still active and visible as part of the quotation.
   */
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

        {/* Informational banner shown only in edit mode */}
        {!readonly && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6 text-sm text-blue-700">
            <span className="shrink-0">ℹ️</span>
            <span>
              Ingresá la cantidad confirmada y el precio unitario ofrecido por
              el proveedor.
            </span>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">
              Ítems Cotizados
            </p>

            {/* Global discard toggle, only available in edit mode */}
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
                  <th className="px-4 py-3 text-left text-foreground">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-center text-foreground">
                    Cant. Solicitada
                  </th>
                  <th className="px-4 py-3 text-center text-foreground">
                    Cant. Confirmada
                  </th>
                  <th className="px-4 py-3 text-center text-foreground">
                    Precio Unit.
                  </th>

                  {/* Discard column is hidden in read-only mode */}
                  {!readonly && <th className="px-4 py-3 text-center text-foreground w-16">Desc.</th>}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.productId}
                    className={`border-t border-border hover:bg-gray-50/60 transition-colors ${
                      row.excluded ? "opacity-50 bg-gray-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-muted">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {row.code}
                    </td>
                    <td
                      className={`px-4 py-3 text-foreground ${
                        row.excluded ? "line-through" : ""
                      }`}
                    >
                      {row.product}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground">
                      {row.requestedQty}
                    </td>

                    {/* Editable quantity field unless readonly or discarded */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={row.confirmedQty}
                        onChange={(e) =>
                          handleChange(index, "confirmedQty", e.target.value)
                        }
                        readOnly={readonly || row.excluded}
                        className={`w-20 ${
                          readonly || row.excluded
                            ? "border border-border rounded px-2 py-1 text-center text-sm bg-gray-50 text-gray-500 cursor-default"
                            : "border border-border rounded px-2 py-1 text-center text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                        }`}
                      />
                    </td>

                    {/* Editable price field unless readonly or discarded */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unitPrice}
                        onChange={(e) =>
                          handleChange(index, "unitPrice", e.target.value)
                        }
                        readOnly={readonly || row.excluded}
                        className={`w-24 ${
                          readonly || row.excluded
                            ? "border border-border rounded px-2 py-1 text-center text-sm bg-gray-50 text-gray-500 cursor-default"
                            : "border border-border rounded px-2 py-1 text-center text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                        }`}
                      />
                    </td>

                    {/* Individual discard checkbox shown only in edit mode */}
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

          {/* Counter of active rows */}
          <p className="text-right text-xs text-muted mt-2">
            Ítems activos: {String(visibleRows.length).padStart(2, "0")}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-[#F2F3F7] transition-colors shadow-panel"
          >
            Atrás
          </button>

          {!readonly && (
            <>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-[#F2F3F7] transition-colors shadow-panel"
              >
                Imprimir
              </button>

              <button
                onClick={handleSave}
                className="px-5 py-2 text-sm font-semibold rounded-[5px] bg-primary text-white hover:bg-primary/90 transition-colors"
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