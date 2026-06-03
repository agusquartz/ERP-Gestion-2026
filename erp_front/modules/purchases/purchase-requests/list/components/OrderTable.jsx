"use client";

export function OrderTable({ orders = [], onSelect, onView }) {
  const headers = ["Pedido Nro.", "Fecha", "Acción"];

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[180px]" /> 
            <col />                       
            <col className="w-[120px]" /> 
          </colgroup>

          <thead>
            <tr className="bg-background">
              {headers.map((h, idx) => (
                <th
                  key={h}
                  className={`sticky top-0 border-b border-border bg-background px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                    idx === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr 
                key={order.id} 
                onClick={() => onSelect(order.id)} 
                className="group border-b border-gray-100 hover:bg-[#f0f7ff] transition-colors cursor-pointer"
              >
                {/* Pedido Nro. - Alineado a la izquierda */}
                <td className="px-4 py-3.5 text-sm font-bold text-[#2b6df5] text-left">
                  {order.request_number}
                </td>

                {/* Fecha - Alineado a la derecha */}
                <td className="px-4 py-3.5 text-sm text-foreground text-right">
                  {order.date}
                </td>

                {/* Acción - Alineado a la derecha */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(order.id);
                      }}
                      className="inline-flex rounded-[5px] p-1 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="w-5 h-5"
                      >
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-9 text-center text-sm text-muted-foreground">
                  No hay pedidos disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
