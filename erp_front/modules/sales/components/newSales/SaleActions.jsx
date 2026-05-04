"use client";

export function SaleActions({ onCancel, onQuote, onInvoice, disabled = false }) {
  return (
    <div className="flex items-center gap-3 border-t border-border p-4">
      <div>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="cursor-pointer min-w-[200px] rounded-[5px] border border-border px-5 py-2.5 text-sm font-semibold text-secondary transition hover:bg-background duration-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      <div className="flex-1 text-center">
        <button
          type="button"
          onClick={onQuote}
          disabled={disabled}
          className="cursor-pointer min-w-[240px] rounded-[5px] border border-primary bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-all duration-200 hover:border-primary hover:bg-primary/5 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          Crear Presupuesto
        </button>
      </div>

      <div className="text-right">
        <button
          type="button"
          onClick={onInvoice}
          disabled={disabled}
          className="cursor-pointer min-w-[260px] rounded-[5px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          Crear Factura
        </button>
      </div>
    </div>
  );
}