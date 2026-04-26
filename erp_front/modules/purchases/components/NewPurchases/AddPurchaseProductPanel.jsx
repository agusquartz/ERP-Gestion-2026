"use client";

import { useState } from "react";

export function AddPurchaseProductPanel({ onAdd, onOpenSearch, selectedProduct, onClearProduct }) {
  const [manualCode, setManualCode] = useState("");
  const [qty, setQty] = useState(1);

  const handleAdd = () => {
    // Lógica para agregar el producto (puedes disparar esto al presionar Enter en el input)
    if (!selectedProduct && !manualCode.trim()) return;
    onAdd(selectedProduct || { codigo: manualCode, descripcion: "", precio: 0 }, qty);
    setManualCode("");
    setQty(1);
    onClearProduct?.();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 border-l-[4px] border-l-[#2563eb] p-5 shadow-sm">
      {/* TÍTULO: Actualizado según Figma */}
      <h3 className="text-[12px] font-bold text-gray-500 tracking-wider mb-5 uppercase">
        Buscar Productos
      </h3>
      
      <div className="flex flex-col gap-4">
        {/* INPUT: Código/Nombre */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
            Código/Nombre
          </label>
          <input
            className="w-full bg-[#e2e8f0]/50 border-none rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="Escanea producto.."
            value={selectedProduct?.codigo ?? manualCode}
            onChange={(e) => { 
              setManualCode(e.target.value); 
              onClearProduct?.(); 
            }}
          />
        </div>

        {/* INPUT: Cantidad (Precio eliminado según pedido) */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
            Cantidad
          </label>
          <input 
            type="number" 
            className="w-full bg-[#e2e8f0]/50 border-none rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
            placeholder="2..."
            value={qty} 
            onChange={(e) => setQty(Number(e.target.value))} 
          />
        </div>

        {/* BOTÓN: Búsqueda Avanzada (Reemplaza al anterior botón de agregar) */}
        <button 
          onClick={onOpenSearch} 
          className="mt-2 w-full bg-white text-[#2563eb] border-2 border-[#2563eb] rounded-lg py-2 text-[11px] font-bold uppercase hover:bg-blue-50 transition-colors active:scale-[0.98]"
        >
          Búsqueda Avanzada
        </button>
      </div>
    </div>
  );
}