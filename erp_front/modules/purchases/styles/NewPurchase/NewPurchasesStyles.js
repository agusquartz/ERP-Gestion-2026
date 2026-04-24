// Estilos específicos del módulo de compras (NewPurchases)
// Basado en la estructura de ventas para mantener consistencia en el TP de FIUNI

export const s = {
  // ── Página ────────────────────────────────────────────────────────────────
  titleSection: {marginBottom: 24},
  pageTitle:     { fontSize: 26, fontWeight: 700, marginBottom: 4, color: "#111827" },
  contentLayout: { display: "grid", gridTemplateColumns: "1fr 224px", gap: 16 },
  errorBanner:   { background: "#FEE2E2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13 },
  divider:       { borderBottom: "1px solid #E5E7EB", marginTop: "4px", marginBottom: "12px"},

  // ── Header row (Proveedor) ────────────────────────────────────────────────
  headerRow:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, color: "#e6e9e8"},
  fieldLabel: { fontWeight: 600, color: "#374151", fontSize: 13 },
  providerName: { fontWeight: 500, color: "#059669", fontSize: 14 }, // Verde para diferenciar de ventas

  // ── Tabla de Neumáticos ───────────────────────────────────────────────────
  container: { 
    padding: "12px",
    display: "flex", 
    flexDirection: "column", 
    gap: 10,
    minHeight: "calc(100vh - 64px)" // Ajusta según el alto de tu navbar
  },
  // Contenedor de la izquierda (Tabla + Botones)
  mainColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    height: "100%"
  },

  tableSection: { background: "white", borderRadius: 10, border: "1px solid #E5E7EB", flexGrow: 1, display: "flex", flexDirection: "column", overflow: 'hidden'},
  tableWrap:    { overflowX: "auto", flexGrow: 1, minHeight: '500px' },
  table:        { width: "100%", borderCollapse: "collapse" },
  th:           { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB", whiteSpace: "nowrap" },
  tr:           { borderBottom: "1px solid #F3F4F6" },
  td:           { padding: "10px 12px", fontSize: 13, color: "#374151" },
  qtyInput:     { width: 60, padding: "4px 8px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 13, textAlign: "center", outline: "none" },
  tableFooter:  { display: "flex", justifyContent: "space-between", padding: "10px 14px", fontSize: 12, color: "#9CA3AF", borderTop: "1px solid #E5E7EB" },

  // ── Acciones Inferiores ───────────────────────────────────────────────────
  actions:       { display: "flex", gap: 10, padding: "20px 0", borderTop: "1px solid #E5E7EB", alignItems: "center", marginTop: "auto", justifyContent: "space-between"},
  btnCancel:     { background: "white", color: "#EF4444", border: "2px solid #EF4444", borderRadius: 5, padding: "9px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, minWidth: 200 },
  btnOrder:      { background: "white", color: "#374151", border: "2px solid #D1D5DB", borderRadius: 5, padding: "9px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, minWidth: 240 },
  btnRegister:   { background: "#059669", color: "white", border: "none", borderRadius: 5, padding: "9px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, minWidth: 260 },
  btnRemove:     { background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4, borderRadius: 5, display: "flex", alignItems: "center" },

  // ── Panel lateral (Add Product / Summary) ─────────────────────────────────
  panelCard:      { background: "white", borderRadius: 10, border: "1px solid #E5E7EB", padding: 14 },
  panelTitle:     { fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5, marginBottom: 10 },
  summaryRow:     { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: "#374151" },
  summaryDivider: { borderTop: "1px solid #E5E7EB", marginTop: 8, paddingTop: 8, fontWeight: 700, fontSize: 16, color: "#059669" },

  // ── Formulario e Inputs ───────────────────────────────────────────────────
  label:      { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, marginTop: 6 },
  input:      { width: "100%", padding: "7px 10px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  inputError: { borderColor: "#EF4444" },
  errorMsg:   { fontSize: 11, color: "#EF4444", display: "block", marginTop: 2 },

  // ── Botones comunes de Compras ──────────────────────────────────────────
  btnPrimary:       { background: "#059669", color: "white", border: "none", borderRadius: 7, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnSecondary:     { background: "white", color: "#374151", border: "1px solid #D1D5DB", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 13 },
  btnSearchCode:    { background: "#059669", color: "white", border: "none", borderRadius: 6, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  btnBuscarProv:    { background: "#059669", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  btnSearch:        { background: "#059669", color: "white", border: "none", borderRadius: 6, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, flexShrink: 0 },
};