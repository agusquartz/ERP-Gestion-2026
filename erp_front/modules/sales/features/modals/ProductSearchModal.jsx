"use client";

import { useState, useEffect, useRef } from "react";
import { Modal }            from "@/shared/components/Modal";
import { ChevronDownIcon }  from "@/shared/components/Icons";
import { s }                from "../../styles/salesStyles";
import { getProductByQuery } from "../../service/saleService";

/**
 * Modal de búsqueda y selección de productos.
 *
 * Props:
 *   open     - boolean
 *   onClose  - () => void
 *   onSelect - (product) => void
 */
export function ProductSearchModal({ open, onClose, onSelect }) {
  const [query,      setQuery]      = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [catFilter,  setCatFilter]  = useState("");
  const [locFilter,  setLocFilter]  = useState("");
  const [filtered,   setFiltered]   = useState([]);
  const [activeRow,  setActiveRow]  = useState(0);
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [showLocDrop, setShowLocDrop] = useState(false);
  const inputRef = useRef();

  const categories = [...new Set(filtered.map((p) => p.categoria))];
  const locations  = [...new Set(filtered.map((p) => p.ubicacion))];

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setQuery(""); setDescFilter(""); setCatFilter(""); setLocFilter("");
      setActiveRow(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Filtro en vivo
  useEffect(() => {
  const fetchData = async () => {
    const q = query.toLowerCase();

    let f = await getProductByQuery(q); 

    if (descFilter)
      f = f.filter((p) =>
        p.descripcion.toLowerCase().includes(descFilter.toLowerCase()) ||
        p.sku.toLowerCase().includes(descFilter.toLowerCase())
      );

    if (catFilter)
      f = f.filter((p) => p.categoria === catFilter);

    if (locFilter)
      f = f.filter((p) => p.ubicacion === locFilter);

    setFiltered(f);
    setActiveRow(0);
  };

  fetchData();
}, [query, descFilter, catFilter, locFilter]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filtered.length > 0) { onSelect(filtered[activeRow]); onClose(); }
    else if (e.key === "ArrowDown") setActiveRow((r) => Math.min(r + 1, filtered.length - 1));
    else if (e.key === "ArrowUp")   setActiveRow((r) => Math.max(r - 1, 0));
  };

  const handleSelect = (p) => { onSelect(p); onClose(); };
  const clearAll = () => { setQuery(""); setDescFilter(""); setCatFilter(""); setLocFilter(""); };

  return (
    <Modal open={open} onClose={onClose} width="80%">
      <h2 style={{ ...s.modalTitle, marginBottom: 16 }}>Buscar Productos</h2>

      {/* Filtros */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
        {/* Búsqueda principal */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4 }}>Buscar</p>
          <input
            ref={inputRef}
            style={s.input}
            placeholder="Buscar por Código, SKU, Descripción..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Filtro descripción */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4 }}>Filtrar Resultados</p>
          <input
            style={s.input}
            placeholder="Filtrar por Descripción, SKU, Código..."
            value={descFilter}
            onChange={(e) => setDescFilter(e.target.value)}
          />
        </div>

        {/* Dropdown Categoría */}
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 11, color: "transparent", marginBottom: 4 }}>-</p>
          <button style={s.btnFilter} onClick={() => { setShowCatDrop(!showCatDrop); setShowLocDrop(false); }}>
            {catFilter || "Categoría"} <ChevronDownIcon />
          </button>
          {showCatDrop && (
            <div style={s.dropdown}>
              <div style={s.dropItem} onClick={() => { setCatFilter(""); setShowCatDrop(false); }}>
                Todas
              </div>
              {categories.map((c) => (
                <div
                  key={c}
                  style={{ ...s.dropItem, ...(catFilter === c ? s.dropItemActive : {}) }}
                  onClick={() => { setCatFilter(c); setShowCatDrop(false); }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown Ubicación */}
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 11, color: "transparent", marginBottom: 4 }}>-</p>
          <button style={s.btnFilter} onClick={() => { setShowLocDrop(!showLocDrop); setShowCatDrop(false); }}>
            {locFilter || "Ubicación"} <ChevronDownIcon />
          </button>
          {showLocDrop && (
            <div style={s.dropdown}>
              <div style={s.dropItem} onClick={() => { setLocFilter(""); setShowLocDrop(false); }}>
                Todas
              </div>
              {locations.map((l) => (
                <div
                  key={l}
                  style={{ ...s.dropItem, ...(locFilter === l ? s.dropItemActive : {}) }}
                  onClick={() => { setLocFilter(l); setShowLocDrop(false); }}
                >
                  {l}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clean All */}
        <div>
          <p style={{ fontSize: 11, color: "transparent", marginBottom: 4 }}>-</p>
          <button style={s.btnClearFilter} onClick={clearAll}>Limpiar</button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>
        Mostrando {filtered.length} de {filtered.length} resultados
      </p>

      {/* Tabla */}
      <div style={s.tableWrap}>
        {filtered === null ? (
          <p>No funciona</p>
        ) : (
        <table style={s.table}>
          <thead>
            <tr>
              {["Código", "SKU", "Descripción", "Ubicación", "Categoría", "Stock", "Precio", "Acción"].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.id}
                style={{ ...s.tr, background: activeRow === i ? "#EBF4FF" : "white", cursor: "pointer" }}
                onClick={() => setActiveRow(i)}
                onDoubleClick={() => handleSelect(p)}
              >
                <td style={s.td}>{p.codigo}</td>
                <td style={s.td}>{p.sku}</td>
                <td style={{ ...s.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.descripcion}>
                  {p.descripcion}
                </td>
                <td style={s.td}>{p.ubicacion}</td>
                <td style={s.td}>{p.categoria}</td>
                <td style={s.td}>{p.stock}</td>
                <td style={s.td}>{p.precio}</td>
                <td style={s.td}>
                  <button style={s.btnSelectProduct} onClick={() => handleSelect(p)}>
                    Seleccionar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 28, color: "#bbb", fontSize: 13 }}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 12, textAlign: "center" }}>
        Usá ↑ y ↓ para navegar y Enter para seleccionar.
      </p>
    </Modal>
  );
}
