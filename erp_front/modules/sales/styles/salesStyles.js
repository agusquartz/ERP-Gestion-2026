// Estilos específicos del módulo de ventas.
// Los tokens base (colores, tipografía) vienen de shared/styles/theme.js

export const s = {
  // ── Página ────────────────────────────────────────────────────────────────
  pageTitle:     { fontSize: 26, fontWeight: 700, marginBottom: 20, color: "#111827" },
  contentLayout: { display: "grid", gridTemplateColumns: "1fr 224px", gap: 16 },
  errorBanner:   { background: "#FEE2E2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13 },

  // ── Header row ────────────────────────────────────────────────────────────
  headerRow:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  fieldLabel: { fontWeight: 600, color: "#374151", fontSize: 13 },
  clientName: { fontWeight: 500, color: "#1D4ED8", fontSize: 14 },

  // ── Tabla ─────────────────────────────────────────────────────────────────
  tableSection: { background: "white", borderRadius: 10, border: "1px solid #E5E7EB" },
  tableWrap:    { overflowX: "auto", height: 380, overflowY: "auto" },
  table:        { width: "100%", borderCollapse: "collapse" },
  th:           { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB", whiteSpace: "nowrap" },
  tr:           { borderBottom: "1px solid #F3F4F6" },
  td:           { padding: "10px 12px", fontSize: 13, color: "#374151" },
  qtyInput:     { width: 60, padding: "4px 8px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 13, textAlign: "center", outline: "none" },
  tableFooter:  { display: "flex", justifyContent: "space-between", padding: "10px 14px", fontSize: 12, color: "#9CA3AF", borderTop: "1px solid #E5E7EB" },

  // ── Acciones ──────────────────────────────────────────────────────────────
  actions:       { display: "flex", gap: 10, padding: 14, borderTop: "1px solid #E5E7EB" , alignItems: "center" },
  btnCancel:     { background: "white", color: "#EF4444", border: "2px solid #EF4444", borderRadius: 5, padding: "9px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 , minWidth: 200},
  btnQuote:      { background: "white", color: "#374151", border: "2px solid #D1D5DB", borderRadius: 5, padding: "9px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 , minWidth: 240 },
  btnInvoice:    { background: "#2563EB", color: "white", border: "none", borderRadius: 5, padding: "9px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 , minWidth: 260 },
  btnRemove:     { background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4, borderRadius: 5, display: "flex", alignItems: "center" },

  // ── Panel derecho ─────────────────────────────────────────────────────────
  panelCard:      { background: "white", borderRadius: 10, border: "1px solid #E5E7EB", padding: 14 },
  panelTitle:     { fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5, marginBottom: 10 },
  summaryRow:     { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: "#374151" },
  summaryDivider: { borderTop: "1px solid #E5E7EB", marginTop: 8, paddingTop: 8, fontWeight: 700, fontSize: 16 },

  // ── Inputs ────────────────────────────────────────────────────────────────
  label:      { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, marginTop: 6 },
  input:      { width: "100%", padding: "7px 10px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  inputError: { borderColor: "#EF4444" },
  errorMsg:   { fontSize: 11, color: "#EF4444", display: "block", marginTop: 2 },

  // ── Botones comunes ───────────────────────────────────────────────────────
  btnPrimary:       { background: "#2563EB", color: "white", border: "none", borderRadius: 7, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnSecondary:     { background: "white", color: "#374151", border: "1px solid #D1D5DB", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 13 },
  btnDanger:        { background: "white", color: "#EF4444", border: "2px solid #EF4444", borderRadius: 8, padding: "10px 28px", cursor: "pointer", fontSize: 14, fontWeight: 600 },
  btnSearchCode:    { background: "#2563EB", color: "white", border: "none", borderRadius: 6, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  btnBuscarCliente: { background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  btnNewClient:     { display: "flex", alignItems: "center", gap: 6, background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnSearch:        { background: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, flexShrink: 0 },
  btnFilter:        { display: "flex", alignItems: "center", gap: 6, background: "white", color: "#374151", border: "1px solid #D1D5DB", borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" },
  btnClearFilter:   { background: "white", color: "#374151", border: "1px solid #D1D5DB", borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontSize: 13 },
  btnSelectProduct: { background: "#2563EB", color: "white", border: "none", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  iconBtn:          { background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4, borderRadius: 4, display: "inline-flex" },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalTitle:    { fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#111827" },
  modalSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
  modalActions:  { display: "flex", gap: 12 },
  formGrid:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" },
  formField:     { display: "flex", flexDirection: "column" },

  // ── Dropdown ──────────────────────────────────────────────────────────────
  dropdown: { position: "absolute", top: "calc(100% + 4px)", left: 0, background: "white", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.10)", zIndex: 20, minWidth: 180, overflow: "hidden" },
  dropItem: { padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "#374151" },
  dropItemActive: { background: "#EBF4FF", color: "#2563eb" },
};
