"use client";
 
import { useState } from "react";
 
/**
 * Hook para manejar el estado open/close de modales y drawers.
 * Reutilizable en cualquier módulo.
 *
 * Uso:
 *   const { isOpen, open, close, toggle } = useDisclosure();
 */
export function useDisclosure(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
 
  return {
    isOpen,
    open:   () => setIsOpen(true),
    close:  () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
 