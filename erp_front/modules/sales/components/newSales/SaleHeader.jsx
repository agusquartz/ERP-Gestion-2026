"use client";

export function SaleHeader({ selectedClient, onBuscarCliente, seller }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-[5px] border border-border px-4 py-3.5 shadow-panel">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">Cliente:</span>

        {selectedClient ? (
          <span className="text-sm font-medium text-primary">
            {selectedClient.name} {selectedClient.surname}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Sin cliente</span>
        )}

        <button
          type="button"
          onClick={onBuscarCliente}
          className="cursor-pointer rounded-[5px] px-3.5 py-1.5 text-sm font-medium border border-primary text-primary hover:bg-primary/5 transition-all duration-200 hover:bg-primary-hover active:translate-y-px"
        >
          Buscar Cliente
        </button>
      </div>

      {/* USERNAME */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">Vendedor</span>
        <span className="text-sm text-foreground">{seller}</span>
      </div>
    </div>
  );
}