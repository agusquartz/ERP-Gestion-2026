"use client";
import { s } from "../styles/NewPurchasesStyles";

export function PurchaseActions({onRegister }) {
  return (
    <div className="flex justify-end pt-4 pb-2">
      <button 
      className={s.btnPrimary}
      onClick={onRegister}>
        Guardar
      </button>
    </div>
  );
}