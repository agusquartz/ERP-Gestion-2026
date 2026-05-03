"use client";

/**
 * This component renders a table of items for a credit note.
 *
 * It allows the user to:
 * - Select or deselect individual rows using checkboxes.
 * - Select or deselect all rows at once.
 * - Enable the "return quantity" input only when a row is selected.
 * - Highlight selected rows visually.
 *
 * Important:
 * This table does NOT own the selected state.
 * The selected state lives in NewCreditNoteModal,
 * because the modal needs that data to create the POST payload.
 */

export function NewCreditNoteTable({
  items = [],
  onToggleItem,
  onToggleAll,
  onChangeQuantity,
}) {
  const allSelected =
    items.length > 0 && items.every((item) => item.selected);

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              {/* Checkbox: Select all */}
              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  onChange={onToggleAll}
                  checked={allSelected}
                  className="w-4 h-4 rounded border-slate-300 text-[#2b6df5] focus:ring-[#2b6df5] cursor-pointer"
                />
              </th>

              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">
                Código
              </th>

              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">
                Descripción
              </th>

              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">
                Cantidad
              </th>

              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">
                Devolver
              </th>

              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">
                Precio Unit.
              </th>

              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">
                Subtotal
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const itemId = item.productId ?? item.code;
              const isChecked = item.selected;

              const originalQty = Number(
                item.OriginalQty ?? item.quantity ?? item.maxQuantity ?? 1
              );

              const returnQty = Number(item.returnQty ?? 1);
              const unitPrice = Number(item.unitPrice ?? item.unitCost ?? 0);
              const subtotal = unitPrice * returnQty;

              return (
                <tr
                  key={itemId}
                  className={`border-b border-slate-50 transition-colors ${
                    isChecked ? "bg-blue-50/30" : "hover:bg-slate-50/50"
                  }`}
                >
                  {/* checkbox: individual */}
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleItem?.(itemId)}
                      className="w-4 h-4 rounded border-slate-300 text-[#2b6df5] focus:ring-[#2b6df5] cursor-pointer"
                    />
                  </td>

                  <td className="px-4 py-3.5 text-[14px] text-slate-600">
                    {item.code}
                  </td>

                  <td
                    className="px-4 py-3.5 text-[14px] text-slate-700 font-semibold truncate"
                    title={item.description}
                  >
                    {item.description}
                  </td>

                  <td className="px-4 py-3.5 text-[14px] text-slate-700 font-semibold">
                    {originalQty}
                  </td>

                  {/* qty INPUT */}
                  <td className="px-4 py-3.5">
                    <input
                      type="number"
                      min="1"
                      max={originalQty}
                      disabled={!isChecked}
                      value={isChecked ? returnQty : ""}
                      onChange={(e) =>
                        onChangeQuantity?.(itemId, e.target.value)
                      }
                      className={`w-20 rounded-[5px] border px-2 py-1 text-[14px] font-bold outline-none transition-all ${
                        isChecked
                          ? "border-[#2b6df5] text-[#2b6df5] bg-white"
                          : "border-slate-100 text-slate-300 bg-slate-50"
                      }`}
                      placeholder="0"
                    />
                  </td>

                  <td className="px-4 py-3.5 text-[14px] font-bold text-slate-900">
                    ${unitPrice.toLocaleString("es-PY")}
                  </td>

                  <td className="px-4 py-3.5 text-[14px] font-bold text-[#2b6df5]">
                    ${subtotal.toLocaleString("es-PY")}
                  </td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-slate-400"
                >
                  No hay productos disponibles para esta factura.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}