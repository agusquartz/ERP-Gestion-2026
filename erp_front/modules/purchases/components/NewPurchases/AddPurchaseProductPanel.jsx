"use client";

import { useState } from "react";
import {s} from "../../styles/NewPurchase/NewPurchasesStyles"

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

  // Esta es la función centralizada para agregar
  const submitAddition = () => {
    const codeToUse = selectedProduct?.codigo || manualCode;
    
    if (!codeToUse.trim()) return;

    // Llamamos a onAdd pasándole el producto y la cantidad
    onAdd(selectedProduct || { codigo: manualCode, descripcion: "Producto Manual", precio: 0 }, qty);
    
    // Limpiamos los estados locales
    setManualCode("");
    setQty(1);
    onClearProduct?.();
  };

  const handleKeyDown = (e) => {
  if (e.key === "Enter") {
    // Evitamos enviar si el código está vacío
    if (!manualCode.trim() && !selectedProduct) return;
    
    onAdd(selectedProduct || { 
      codigo: manualCode, 
      descripcion: "Producto Manual", 
      precio: 0 
    }, qty);

    // Limpiamos para el siguiente ingreso
    setManualCode("");
    setQty(1);
  }
};

  return (
    <div className="bg-white rounded-xl border border-gray-200 border-l-[4px] border-l-[#2563eb] p-5 shadow-sm">
      {/* TÍTULO */}
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
            placeholder="Escanea el producto.."
            value={selectedProduct?.codigo ?? manualCode}
            onKeyDown={handleKeyDown} // ← Detectar Enter aquí
            onChange={(e) => { 
              setManualCode(e.target.value); 
              onClearProduct?.(); 
            }}
          />
        </div>

        {/* INPUT: Cantidad */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
            Cantidad
          </label>
          <input 
            type="number" 
            className="w-full bg-[#e2e8f0]/50 border-none rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
            placeholder="2..."
            value={qty} 
            onKeyDown={handleKeyDown} // ← Detectar Enter aquí también
            onChange={(e) => setQty(Number(e.target.value))} 
          />
        </div>

        {/* BOTÓN: Búsqueda Avanzada */}
        <button 
          onClick={onOpenSearch}
          className={s.btnOutline}
        >
          BÚSQUEDA AVANZADA
        </button>
      </div>
    </div>
  );
}