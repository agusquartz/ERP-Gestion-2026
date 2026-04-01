export default function AppLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{
        width: 180, background: "white", borderRight: "1px solid #E5E7EB",
        display: "flex", flexDirection: "column", padding: "16px 0",
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px 16px", borderBottom: "1px solid #E5E7EB", marginBottom: 8, fontSize: 15 }}>
          <span style={{ fontSize: 18 }}>🔷</span>
          <strong>The ERP</strong>
        </div>
        <nav style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", padding: "8px 16px 4px", letterSpacing: 1, margin: 0 }}>
            SALES MODULE
          </p>
          <a href="/sales" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", color: "#2563EB", fontSize: 13, background: "#EBF4FF", borderLeft: "3px solid #2563EB", cursor: "pointer" }}>
              <span>🔖</span> Nueva Venta
            </div>
          </a>
          <a href="/sales/documents" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", color: "#374151", fontSize: 13, borderLeft: "3px solid transparent", cursor: "pointer" }}>
              <span>📄</span> Documentos
            </div>
          </a>
        </nav>
        <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", color: "#374151", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
          <span>↪</span> Logout
        </button>
      </aside>
      <main style={{ marginLeft: 180, flex: 1, minHeight: "100vh", background: "#F3F4F6" }}>
        {children}
      </main>
    </div>
  );
}