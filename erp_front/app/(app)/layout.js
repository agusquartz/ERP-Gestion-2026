
'use client'
import { useState } from "react";

export default function AppLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-[#F8FAFC]">
        
        {/* LOGO */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[5px]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="5" fill="#185BFF"/>
              <path d="M13 26V19H15V26H13ZM19 26V19H21V26H19ZM10 30V28H30V30H10ZM25 26V19H27V26H25ZM10 17V15L20 10L30 15V17H10Z" fill="#F5F7FF"/>
            </svg>
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Neumaticos Enc sa</span>
            <span className="text-xs text-muted-foreground">Venta Minorista</span>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Sales Module
          </p>

          <a href="/sales">
            <div className="mb-1 flex items-center gap-3 rounded-md border-l-[3px] border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
              Nueva Venta
            </div>
          </a>

          <a href="/sales/documents">
            <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted/10">
              Documentos
            </div>
          </a>
        </nav>

        {/* FOOTER */}
        <div className="border-t border-border p-2">
          <button className="cursor-pointer flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-destructive/10">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ml-64 flex-1 bg-[#D9D9D9]">
        <div className="min-h-screen h-full p-6">
          {children}
        </div>

      
      </main>
    </div>
  );
}