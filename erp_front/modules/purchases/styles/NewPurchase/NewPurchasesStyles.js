// Estilos específicos del módulo de compras (NewPurchases)
// Basado en la estructura de ventas para mantener consistencia en el TP de FIUNI

export const s = {
  // ── Página ────────────────────────────────────────────────────────────────
  container: "h-screen w-full overflow-hidden bg-[#f1f5f9] flex flex-col p-6",
  titleSection: "mb-4",
  pageTitle: "text-2xl font-bold text-[#1e293b]", // Ajustado a 2xl como el Figma
  contentLayout: "grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 flex-1 min-h-0 overflow-hidden h-full",
  
  // ── Tabla de Neumáticos ───────────────────────────────────────────────────
  tableSection: "flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col",
  tableWrap: "flex-1 overflow-auto min-h-0", // Cambiado a clase Tailwind para control de scroll
  table: "w-full border-collapse",
  // Encabezado fino y grisáceo
  th: "sticky top-0 z-10 bg-[#f8fafc] px-4 py-2 text-left text-[11px] font-bold text-slate-500 uppercase border-b border-gray-100",
  tr: "hover:bg-gray-50/50 transition-colors border-b border-gray-50",
  td: "px-4 py-3 text-sm text-gray-600",
  // Cantidad sin bordes para que parezca texto
  qtyInput: "w-full bg-transparent border-none text-sm text-center focus:ring-0 outline-none",

  // ── Panel lateral (Add Product / Summary) ─────────────────────────────────
  // Agregamos el borde azul izquierdo aquí
  panelCard: "bg-white rounded-xl border border-gray-200 border-l-[4px] border-l-[#2563eb] p-5 shadow-sm",
  panelTitle: "text-[12px] font-bold text-gray-500 tracking-wider mb-5 uppercase",
  
  // Resumen de totales
  summaryRow: "flex justify-between items-center text-[13px] text-gray-500 mb-3",
  summaryValue: "font-semibold text-gray-700",
  // Total en Negro y grande
  summaryTotal: "flex justify-between items-end mt-4 pt-4 border-t border-gray-100 text-gray-900",

  // ── Inputs del Panel de Búsqueda ──────────────────────────────────────────
  label: "block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1",
  input: "w-full bg-[#e2e8f0]/50 border-none rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 transition-all",

  // ── Botones ───────────────────────────────────────────────────────────────
  btnPrimary: "bg-[#2563eb] text-white px-12 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-md active:scale-95",
  // Botón Búsqueda Avanzada (Borde azul)
  btnOutline: "w-full bg-white text-[#2563eb] border-2 border-[#2563eb] rounded-lg py-2 text-[11px] font-bold uppercase hover:bg-blue-50 transition-colors",
  
  infoPanel: "bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3",
  infoText: "text-[12px] text-slate-500 leading-relaxed",
};