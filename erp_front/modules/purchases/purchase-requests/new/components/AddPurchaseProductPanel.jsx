"use client";

import { useState } from "react";
import {s} from "../styles/NewPurchasesStyles"
import { getProductByQuery } from "@/lib/http/client/sales";
import { Toaster, toast } from 'sonner';

/**
 * Component for handling product addition via code scanning or search modal.
 * Managed within the Purchase Request flow.
 */
export function AddPurchaseProductPanel({ onAdd, onOpenSearch, selectedProduct, onClearProduct }) {
  const [manualCode, setManualCode] = useState("");
  const [qty, setQty] = useState(1);
  const [query, setQuery] = useState("");

  /**
   * Executed when 'Enter' is pressed in the code or quantity inputs.
   * Validates the product against the database and adds it to the list.
   */
  const handleKeyDown = async (e) => {
    if (e.key === "Enter") {
    const queryValue = e.target.value.trim();
    if (!queryValue) return;

    try {
      // Fetch product data from the API based on the entered code
      let products = await getProductByQuery(queryValue);
      
      // Perform a case-insensitive search for an exact match in the results
      const foundProduct = products.find(
        p => (p.code || p.codigo || "").toLowerCase() === queryValue.toLowerCase()
      );

      if (foundProduct) {
        // If the product exists, trigger the addition with the current quantity
        onAdd({...foundProduct,
          cantidad: qty} 
        );

        // Reset UI states to prepare for the next scan
        onClearProduct?.(); 
        toast.success(`Producto añadido: ${foundProduct.description}`);
        setManualCode("");
        setQty(1);
        setQuery("");
      } else {
        // Handle cases where the scanned code is not registered
        toast.error("Producto no encontrado", {
          description: `El código no figura en el sistema. Debe registrarlo primero o verificar el código.`,
          duration: 4000,
        });
      }
    } catch (error) {
      // Log errors for debugging purposes while keeping user notified
      console.error("Search error details:", error);
      toast.error("Error al buscar el producto");
    }
  }

};

  return (
    <div className="bg-white rounded-xl border border-gray-200 border-l-[4px] border-l-[#2563eb] p-5 shadow-sm">
      {/* SECTION HEADER */}
      <h3 className="text-[12px] font-bold text-gray-500 tracking-wider mb-5 uppercase">
        Buscar Productos
      </h3>
      
      <div className="flex flex-col gap-4">
        {/* INPUT: Product Code/Name - Primary target for barcode scanners */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
            Código/Nombre
          </label>
          <input
            className="w-full bg-[#e2e8f0]/50 border-none rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="Escanea el producto.."
            value={selectedProduct?.codigo ?? manualCode}
            onKeyDown={handleKeyDown}
            onChange={(e) => { 
              setManualCode(e.target.value); 
              onClearProduct?.(); 
            }}
          />
        </div>

        {/* INPUT: Quantity selection */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
            Cantidad
          </label>
          <input 
            type="number" 
            className="w-full bg-[#e2e8f0]/50 border-none rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
            placeholder="2..."
            value={qty} 
            onKeyDown={handleKeyDown}
            onChange={(e) => setQty(Number(e.target.value))} 
          />
        </div>

        {/* ACTION: Manual search via modal */}
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