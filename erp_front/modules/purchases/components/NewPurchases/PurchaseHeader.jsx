"use client";
export function PurchaseHeader({ selectedProvider, onBuscarProveedor, user }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-[5px] border border-border px-4 py-3.5 shadow-panel">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">Proveedor:</span>
        {selectedProvider ? (
          <span className="text-sm font-medium text-primary">{selectedProvider.razonSocial}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Sin proveedor</span>
        )}
        <button type="button" onClick={onBuscarProveedor} className="cursor-pointer rounded-[5px] px-3.5 py-1.5 text-sm font-medium border border-primary text-primary hover:bg-primary/5 transition-all duration-200 hover:bg-primary-hover active:translate-y-px">
          Buscar Proveedor
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">Usuario</span>
        <span className="text-sm text-foreground">{user}</span>
      </div>
    </div>
  );
}