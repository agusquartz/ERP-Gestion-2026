"use client";
import { useState } from "react";

/**
 * This component renders a table of items for a credit note.
 *
 * It allows the user to:
 * - Select or deselect individual rows using checkboxes.
 * - Select or deselect all rows at once.
 * - Enable the "return quantity" input only when a row is selected.
 * - Highlight selected rows visually.
 *
 * The selected rows are stored in the selectedRows state using each item's code.
 */

export function NewCreditNoteTable({ items = [] }) {
  // Status to save which rows are marked (we save their IDs or codes)
  const [selectedRows, setSelectedRows] = useState([]);
  

  /*CHECBOXS FUNCTIONS*/
  //Function to select/deselect an individual row
  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Function to select/deselect all rows
  const toggleAll = () => {
    if (selectedRows.length === items.length) {
      setSelectedRows([]); //If they're all marked,we clean
    } else {
      setSelectedRows(items.map((item) => item.code)); // all mark it
    }
  };

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
                  onChange={toggleAll}
                  checked={items.length > 0 && selectedRows.length === items.length}
                  className="w-4 h-4 rounded border-slate-300 text-[#2b6df5] focus:ring-[#2b6df5] cursor-pointer"
                />

              {/* table with descriptions */}
              </th>
              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">Código</th>
              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">Descripción</th>
              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">Devolver</th>
              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">Precio Unit.</th>
              <th className="sticky top-0 border-b border-slate-100 px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase">Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const isChecked = selectedRows.includes(item.code);
              
              return (
                <tr 
                  key={item.code} 
                  className={`border-b border-slate-50 transition-colors ${isChecked ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
                >
                  {/* checkbox: individual */}
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRow(item.code)}
                      className="w-4 h-4 rounded border-slate-300 text-[#2b6df5] focus:ring-[#2b6df5] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-[14px] text-slate-600">{item.code}</td>
                  <td className="px-4 py-3.5 text-[14px] text-slate-700 font-semibold truncate">{item.description}</td>
                  
                  {/* qty INPUT (Only enabled if the checkbox is selected)  */}
                  <td className="px-4 py-3.5">
                    <input
                      type="number"
                      disabled={!isChecked}
                      className={`w-20 rounded-[5px] border px-2 py-1 text-[14px] font-bold outline-none transition-all
                        ${isChecked 
                          ? 'border-[#2b6df5] text-[#2b6df5] bg-white' 
                          : 'border-slate-100 text-slate-300 bg-slate-50'}`}
                      placeholder="0"
                    />
                  </td>

                   {/* show unit price and subtotal  */}
                  <td className="px-4 py-3.5 text-[14px] font-bold text-slate-900">${item.unitPrice?.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-[14px] font-bold text-[#2b6df5]">${(item.unitPrice * item.OriginalQty)?.toLocaleString()}</td>
                </tr>


              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}