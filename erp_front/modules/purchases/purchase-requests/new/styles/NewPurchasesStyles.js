/**
 * Specific styles for the Procurement module (NewPurchases).
 * Organized by UI functional sections.
 */

export const s = {
  // ── Page Wrapper & Layout ──────────────────────────────────────────────────
  // Main viewport container with overflow prevention and flex alignment
  container: "flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-24px)] md:h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:p-4 md:p-6",
  titleSection: "mb-4",
  pageTitle: "text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]", // Size adjusted to match Figma specs (2xl)
  contentLayout: "grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 flex-1 min-h-0",
  
  // ── Items Table (Inventory/Tires) ──────────────────────────────────────────
  // Scrollable table container with card styling
  tableSection: "flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden",
  tableWrap: "flex-1 overflow-auto min-h-0", // Tailwind utility for internal scroll control
  table: "w-full border-collapse",

  // Table Headers: Sticky positioning for better UX during long lists
  th: "sticky top-0 z-10 bg-[#f8fafc] px-4 py-2 text-left text-[11px] font-bold text-slate-500 uppercase border-b border-gray-100",
  tr: "hover:bg-gray-50/50 transition-colors border-b border-gray-50",
  td: "px-4 py-3 text-sm text-gray-600",

  // Quantity Input: Borderless design to blend seamlessly with the table row
  qtyInput: "w-full bg-transparent border-none text-sm text-center focus:ring-0 outline-none",

  // ── Side Panels (Add Product / Summary) ────────────────────────────────────
  // Sidebar cards featuring the signature blue left border for visual hierarchy
  panelCard: "bg-white rounded-xl border border-gray-200 border-l-[4px] border-l-[#2563eb] p-5 shadow-sm",
  panelTitle: "text-[12px] font-bold text-gray-500 tracking-wider mb-5 uppercase",
  
  // Summary Row: Key-value pair styling for totals
  summaryRow: "flex justify-between items-center text-[13px] text-gray-500 mb-3",
  summaryValue: "font-semibold text-gray-700",
  
  // Grand Total: High-contrast typography for final calculation
  summaryTotal: "flex justify-between items-end mt-4 pt-4 border-t border-gray-100 text-gray-900",

  // ── Search Panel Form Fields ───────────────────────────────────────────────
  label: "block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1",
  input: "w-full bg-[#e2e8f0]/50 border-none rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 transition-all",

  // ── Action Buttons ─────────────────────────────────────────────────────────
  // Primary action button (e.g., Save Request)
  btnPrimary: "cursor-pointer min-w-[260px] rounded-[5px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:translate-y-px",
  
  // Advanced Search Button: Outline variation for secondary actions
  btnOutline: "w-full bg-white text-[#2563eb] border-2 border-[#2563eb] rounded-lg py-2 text-[11px] font-bold uppercase hover:bg-blue-50 transition-colors",
  
  // Informational / Help Panel: Low-contrast container for module guidance
  infoPanel: "bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3",
  infoText: "text-[12px] text-slate-500 leading-relaxed",
};