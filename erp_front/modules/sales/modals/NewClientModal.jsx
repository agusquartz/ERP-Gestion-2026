"use client";

import { useState } from "react";
import { Modal } from "@/shared/components/Modal";
import { s } from "../styles/salesStyles";
import { createClient } from "../services/saleService"

const FIELDS = [
  { key: "nombre",   label: "Nombre",            placeholder: "Ingresa el nombre" },
  { key: "apellido", label: "Apellido",           placeholder: "Ingresa el apellido" },
  { key: "ruc",      label: "RUC",                placeholder: "ej. 1.213.134-5" },
  { key: "ciudad",   label: "Ciudad",             placeholder: "ej. Asunción" },
  { key: "telefono", label: "Teléfono",           placeholder: "+595 9xxx xxx" },
  { key: "email",    label: "Correo electrónico", placeholder: "examples@gmail.com" },
];

const EMPTY = { nombre: "", apellido: "", ruc: "", ciudad: "", telefono: "", email: "" };

/**
 * Modal de alta de nuevo cliente.
 *
 * Props:
 *   open     - boolean
 *   onClose  - () => void
 *   onCreate - (data) => void
 */
export function NewClientModal({ open, onClose, onCreate }) {
  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    FIELDS.forEach(({ key }) => { if (!form[key].trim()) e[key] = "Requerido"; });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
        const newClient = await createClient(form);
        onCreate(newClient);    //Devuelve el cliente recien creado al padre
        setForm(EMPTY);
        setErros({});
        onClose();
    } catch (err) {
        console.error("Error al crear el cliente", err);
    }
  };

  const handleClose = () => {
    setForm(EMPTY);
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} width={560}>
      <h2 style={s.modalTitle}>Nuevo Cliente</h2>
      <p style={s.modalSubtitle}>Ingresa los datos del nuevo cliente</p>

      <div style={s.formGrid}>
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} style={s.formField}>
            <label style={s.label}>
              {label}<span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              style={{ ...s.input, ...(errors[key] ? s.inputError : {}) }}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
            />
            {errors[key] && <span style={s.errorMsg}>{errors[key]}</span>}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#6B7280", margin: "12px 0 24px" }}>
        <span style={{ color: "#EF4444" }}>*</span> Campo obligatorio
      </p>

      <div style={s.modalActions}>
        <button style={s.btnDanger}  onClick={handleClose}>Cancelar</button>
        <button style={s.btnPrimary} onClick={handleSubmit}>Crear Cliente</button>
      </div>
    </Modal>
  );
}
