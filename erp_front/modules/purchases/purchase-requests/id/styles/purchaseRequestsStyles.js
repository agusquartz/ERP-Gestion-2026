/**
 * @file purchaseRequestsStyles.js
 * @module modules/purchases/styles/purchase-order
 *
 * Centralized design tokens and reusable Tailwind class strings for the
 * Purchase Order views and components.
 */

export const btn = {
  primary:
    "px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors",
  secondary:
    "px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-gray-50 transition-colors",
  primarySm:
    "px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors",
  secondarySm:
    "px-3 py-1 rounded-lg border border-border text-secondary text-xs font-medium hover:bg-gray-200 hover:shadow-sm active:bg-gray-300 transition-all duration-150",
};

export const card = {
  base: "rounded-xl overflow-hidden border border-border bg-surface",
};

export const table = {
  base: "w-full text-sm",
  head: "bg-border/40 text-muted text-xs uppercase tracking-wide",
  th: "px-4 py-3 text-left text-foreground",
  thCenter: "px-4 py-3 text-center text-foreground",
  td: "px-4 py-3 text-foreground",
  tdMuted: "px-4 py-3 text-muted",
  tdCenter: "px-4 py-3 text-center text-foreground",
  row: "border-t border-border hover:bg-gray-50/60 transition-colors",
};

export const badge = {
  category:
    "px-2 py-0.5 rounded-full bg-border/60 text-muted text-xs font-medium uppercase tracking-wide",
  pendiente:
    "px-3 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-300",
  listo:
    "px-3 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300",
  cancelado:
    "px-3 py-0.5 rounded-full text-xs font-semibold border bg-[#FFE6E5] text-[#5D0000] border-[#91372B]",
};

export const label = {
  section: "text-xs font-semibold text-muted uppercase tracking-widest mb-3",
};

export const input = {
  editable:
    "border border-border rounded px-2 py-1 text-center text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors",
  readOnly:
    "border border-border rounded px-2 py-1 text-center text-sm bg-gray-50 text-gray-500 cursor-default",
  search:
    "w-full border border-border rounded-lg px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors",
};

export const modal = {
  overlay:
    "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]",
  card: "relative bg-surface rounded-xl w-full mx-4 p-8",
  title: "text-2xl font-bold text-foreground",
  infoBanner:
    "flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6 text-sm text-blue-700",
};
