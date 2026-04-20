"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/shared/components/Modal";
import { NewClientModal } from "./NewClientModal";
import { EditClientModal } from "./EditClientModal";
import { EditIcon, PlusIcon } from "@/shared/components/Icons";
import { useDisclosure } from "@/shared/hooks/useDisclosure";
import { getClients } from "../services/saleService";

export function ClientSearchModal({
  open,
  onClose,
  onSelect,
  onClientCreate,
}) {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [activeRow, setActiveRow] = useState(0);
  const [selectedClient, setSelectedClient] = useState(null);

  const newClientModal = useDisclosure();
  const editClientModal = useDisclosure();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const fetchClients = async () => {
      try {
        const data = await getClients();
        setClientsList(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchClients();
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setFiltered(clientsList);
      setActiveRow(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, clientsList]);

  useEffect(() => {
    const q = query.toLowerCase().trim();

    setFiltered(
      clientsList.filter((c) => {
        const nombre = (c?.nombre ?? "").toLowerCase();
        const apellido = (c?.apellido ?? "").toLowerCase();
        const ruc = (c?.ruc ?? "").toString();

        return (
          nombre.includes(q) ||
          apellido.includes(q) ||
          ruc.includes(q)
        );
      })
    );

    setActiveRow(0);
  }, [query, clientsList]);

  const handleKeyDown = (e) => {
    if (filtered.length === 0) return;

    if (e.key === "Enter") {
      onSelect(filtered[activeRow]);
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveRow((r) => Math.min(r + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveRow((r) => Math.max(r - 1, 0));
    }
  };

  const handleSelect = (client) => {
    onSelect(client);
    onClose();
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    editClientModal.open();
  };

  const handleCreate = (data) => {
    onClientCreate(data);
    newClientModal.close();
    onClose();
  };


  return (
    <>
      <Modal open={open} onClose={onClose} width={700}>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Clientes
          </h2>

          <button
            type="button"
            onClick={newClientModal.open}
            className="inline-flex h-9 items-center gap-2 rounded-[5px] border border-primary bg-primary px-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary-hover active:translate-y-px"
          >
            <PlusIcon />
            Nuevo cliente
          </button>
        </div>

        <p className="mb-1 text-xs font-semibold text-muted-foreground">
          Búsqueda
        </p>

        <div className="mb-2 flex gap-2">
          <input
            ref={inputRef}
            className="h-10 flex-1 rounded-[5px] border border-border bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="Buscar cliente: nombre, apellido o ruc..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            type="button"
            className="h-10 rounded-[5px] border border-primary px-4 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/5 active:translate-y-px"
          >
            Buscar
          </button>
        </div>

        <p className="mb-2 text-xs text-muted-foreground">
          Mostrando {filtered.length} de {clientsList.length} resultados
        </p>

        <div className="overflow-hidden rounded-[5px] border border-border bg-surface">
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#f8fafc]">
                <tr className="border-b border-border">
                  {["Nombre", "Apellido", "RUC", "Ciudad", "Teléfono", "Email", "Acción"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`cursor-pointer border-b border-border transition-colors duration-150 ${
                      activeRow === i ? "bg-[#ebf4ff]" : "bg-white hover:bg-[#f8fafc]"
                    }`}
                    onClick={() => setActiveRow(i)}
                    onDoubleClick={() => handleSelect(c)}
                  >
                    <td className="px-3 py-3 text-sm text-foreground">{c.nombre}</td>
                    <td className="px-3 py-3 text-sm text-foreground">{c.apellido}</td>
                    <td className="px-3 py-3 text-sm text-foreground">{c.ruc}</td>
                    <td className="px-3 py-3 text-sm text-foreground">{c.ciudad}</td>
                    <td className="px-3 py-3 text-sm text-foreground">{c.telefono}</td>
                    <td className="px-3 py-3 text-sm text-primary">
                      {c.email || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(c);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] border border-border text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5 active:translate-y-px"
                        title="Editar cliente"
                      >
                        <EditIcon />
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-7 text-center text-sm text-muted-foreground"
                    >
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Doble click o Enter para seleccionar cliente
        </p>
      </Modal>

      <NewClientModal
        open={newClientModal.isOpen}
        onClose={newClientModal.close}
        onCreate={handleCreate}
      />

      <EditClientModal
        open={editClientModal.isOpen}
        onClose={editClientModal.close}
        client={selectedClient}
        onUpdate={(updated) => {
          setClientsList((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        }}
      />
    </>
  );
}