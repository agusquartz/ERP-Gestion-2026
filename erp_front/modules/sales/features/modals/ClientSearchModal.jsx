"use client";

import { useState, useEffect, useRef } from "react";
import { Modal }          from "@/shared/components/Modal";
import { NewClientModal } from "./NewClientModal";
import { EditIcon, PlusIcon } from "@/shared/components/Icons";
import { useDisclosure }  from "@/shared/hooks/useDisclosure";
import { s } from "../../styles/salesStyles";
import { getClients } from "../../services/saleService";


/**
 * Modal de búsqueda y selección de clientes.
 *
 * Props:
 *   open           - boolean
 *   onClose        - () => void
 *   clients        - array de clientes
 *   onSelect       - (client) => void
 *   onClientCreate - (data) => void
 */
export function ClientSearchModal({ open, onClose, onSelect, onClientCreate }) {
  const [query, setQuery]       = useState("");
  const [filtered, setFiltered] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [activeRow, setActiveRow] = useState(0);
  const newClientModal = useDisclosure();
  const inputRef = useRef();

 
 //Cargar clientes al abrir
  useEffect(() => {
    if (!open) return;

    const fetchClients = async () => {
        try {
            const data = await getClients();
            setClientsList(data);
        } catch (err){
            console.error(err);
        }
    }
    fetchClients();
  }, [open]);

 // Reset al abrir y al actualizar la lista
  useEffect(() => {
    if (open) {
      setQuery("");
      setFiltered(clientsList);
      setActiveRow(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, clientsList]);

  // Filtro en vivo
  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(
      clientsList.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.apellido.toLowerCase().includes(q) ||
          c.ruc.includes(q)
      )
    );
    setActiveRow(0);
  }, [query, clientsList]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filtered.length > 0) { onSelect(filtered[activeRow]); onClose(); }
    else if (e.key === "ArrowDown") setActiveRow((r) => Math.min(r + 1, filtered.length - 1));
    else if (e.key === "ArrowUp")   setActiveRow((r) => Math.max(r - 1, 0));
  };

  const handleSelect = (client) => { onSelect(client); onClose(); };

  const handleCreate = (data) => {
    onClientCreate(data);
    newClientModal.close();
    onClose();
  };

  return (
    <>
      <Modal open={open && !newClientModal.isOpen} onClose={onClose} width={700}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <h2 style={{ ...s.modalTitle, margin: 0 }}>Clientes</h2>
          <button style={s.btnNewClient} onClick={newClientModal.open}>
            <PlusIcon /> Nuevo cliente
          </button>
        </div>

        {/* Búsqueda */}
        <p style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Búsqueda</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            ref={inputRef}
            style={{ ...s.input, flex: 1 }}
            placeholder="Buscar cliente: nombre, apellido o ruc..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button style={s.btnSearch}>Buscar</button>
        </div>

        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>
          Mostrando {filtered.length} de {clientsList.length} resultados
        </p>

        {/* Tabla */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Nombre", "Apellido", "RUC", "Ciudad", "Teléfono", "Email", "Acción"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  style={{ ...s.tr, background: activeRow === i ? "#EBF4FF" : "white", cursor: "pointer" }}
                  onClick={() => setActiveRow(i)}
                  onDoubleClick={() => handleSelect(c)}
                >
                  <td style={s.td}>{c.nombre}</td>
                  <td style={s.td}>{c.apellido}</td>
                  <td style={s.td}>{c.ruc}</td>
                  <td style={s.td}>{c.ciudad}</td>
                  <td style={s.td}>{c.telefono}</td>
                  <td style={{ ...s.td, color: "#2563eb" }}>{c.email || "—"}</td>
                  <td style={s.td}>
                    <button style={s.iconBtn} onClick={() => handleSelect(c)}>
                      <EditIcon />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 28, color: "#bbb", fontSize: 13 }}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 12, textAlign: "center" }}>
          Doble click o enter para seleccionar cliente
        </p>
      </Modal>

      {/* Sub-modal: nuevo cliente */}
      <NewClientModal
        open={newClientModal.isOpen}
        onClose={newClientModal.close}
        onCreate={handleCreate}
      />
    </>
  );
}
