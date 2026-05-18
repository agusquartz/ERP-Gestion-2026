"use client";
import React from "react";

// Tab navigation bar for the invoice detail view.
// Three tabs: Productos, Pagos de la Factura, Notas de Devolución.
const TABS = [
  { key: "products", label: "Productos" },
  { key: "payments", label: "Pagos de la Factura" },
  { key: "returnNotes", label: "Notas de Devolución" },
];

export function InvoiceDetailTabs({ activeTab, onChange }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-[5px] border border-border px-4 py-3.5 shadow-panel">
      
      {/* Tabs Section */}
      <div className="flex items-center gap-2 bg-slate-50/50 rounded-xl w-fit">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`
                px-4 py-2.5 text-sm font-bold transition-all duration-200 rounded-lg
                ${isActive
                  ? "bg-[#f0f7ff] text-[#2b6df5] shadow-sm ring-1 ring-[#e0eeff]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

    </div>
  );
}