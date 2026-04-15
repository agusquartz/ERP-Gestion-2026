"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/shared/components/Modal";
import { s } from "../styles/salesStyles";
import { editClient } from "../services/saleService"

const FIELDS = [
  { key: "nombre",   label: "Nombre", placeholder: "Ingresa el nombre" },
  { key: "apellido", label: "Apellido", placeholder: "Ingresa el apellido" },
  { key: "ruc",      label: "RUC", placeholder: "ej. 1.213.134-5" },
  { key: "ciudad",   label: "Ciudad", placeholder: "ej. Asunción" },
  { key: "telefono", label: "Teléfono", placeholder: "+595 9xxx xxx" },
  { key: "email",    label: "Correo electrónico", placeholder: "example@gmail.com" },
];


export function EditClientModal({ open, onClose, client, onUpdate}) {
    const [form, setForm] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() =>{
        if (open && client) setForm(client);
    }, [open, client]);

    const validate = () => {
        const e = {};
        FIELDS.forEach(({ key }) => {
            if (!form[key]?.trim()) e[key] = "Requerido";   
        });

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            const updated = await editClient(client.id, form);
            onUpdate(updated);
            onClose();
        } catch (err) {
            console.error("Error al editar el cliente", err);
        }
    };

    const handleClose = () => {
        setErrors({});
        setForm({});
        onClose();
    };


    return (
    <Modal open={open} onClose={handleClose} width={560}>
      <h2 style={s.modalTitle}>Editar Cliente</h2>
      <p style={s.modalSubtitle}>Modifica los datos del cliente</p>

      <div style={s.formGrid}>
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} style={s.formField}>
            <label style={s.label}>
              {label}<span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              style={{ ...s.input, ...(errors[key] ? s.inputError : {}) }}
              placeholder={placeholder}
              value={form[key] || ""}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
            />
            {errors[key] && <span style={s.errorMsg}>{errors[key]}</span>}
          </div>
        ))}
      </div>

      <div style={s.modalActions}>
        <button style={s.btnDanger} onClick={handleClose}>Cancelar</button>
        <button style={s.btnPrimary} onClick={handleSubmit}>Guardar cambios</button>
      </div>
    </Modal>
  );
}
