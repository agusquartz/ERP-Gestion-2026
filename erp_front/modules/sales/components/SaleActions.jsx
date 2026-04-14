"use client";

export function SaleActions({ onCancel, onQuote, onInvoice }) {
  return (
    <div className="flex items-center gap-3 border-t border-border p-4">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer min-w-[200px] rounded-[5px] border border-primary bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/5 active:translate-y-px"
        >
          Cancelar
        </button>
      </div>

      <div className="flex-1 text-center">
        <button
          type="button"
          onClick={onQuote}
          className="cursor-pointer min-w-[240px] rounded-[5px] border border-primary bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-all duration-200 hover:border-primary hover:bg-primary/5 active:translate-y-px"
        >
          Crear Presupuesto
        </button>
      </div>

      <div className="text-right">
        <button
          type="button"
          onClick={onInvoice}
          className="cursor-pointer min-w-[260px] rounded-[5px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:translate-y-px"
        >
          Crear Factura
        </button>
      </div>
    </div>
  );
}