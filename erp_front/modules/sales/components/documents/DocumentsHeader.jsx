"use client";
import React, { useState } from 'react';

export function DocumentsHeader({ activeTab, setActiveTab }) {

  const tabs = ['Facturas', 'Presupuesto', 'Notas de Credito'];

  return (
    <div className="mb-4 flex items-center justify-between rounded-[5px] border border-border px-4 py-3.5 shadow-panel">
   
      {/* Tabs Section*/}
      <div className="flex items-center gap-2 p-1.5 bg-slate-50/50 rounded-xl w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-6 py-2.5 text-sm font-bold transition-all duration-200 rounded-lg txt-[10px]
                ${isActive 
                  ? "bg-[#f0f7ff] text-[#2b6df5] shadow-sm ring-1 ring-[#e0eeff]" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              {tab}
            </button>
          );
        })}
      </div>
      
    </div>
  );
}