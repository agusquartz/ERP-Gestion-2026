"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/shared/components/Modal";
import { editClient } from "../services/saleService";

const FIELDS = [
  { key: "nombre", label: "Nombre", placeholder: "Ingresa el nombre", required: true },
  { key: "apellido", label: "Apellido", placeholder: "Ingresa el apellido", required: true },
  { key: "ruc", label: "RUC", placeholder: "ej. 1.213.134-5", required: true },
  { key: "ciudad", label: "Ciudad", placeholder: "ej. Asunción", required: true },
  { key: "telefono", label: "Teléfono", placeholder: "+595 9xxx xxx", required: true },
  { key: "email", label: "Correo electrónico", placeholder: "example@gmail.com", required: true },
];

const EMPTY = {
  nombre: "",
  apellido: "",
  ruc: "",
  ciudad: "",
  telefono: "",
  email: "",
  fechaNacimiento: "",
};

export function EditClientModal({ open, onClose, client, onUpdate }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && client) {
      setForm({
        nombre: client.nombre || "",
        apellido: client.apellido || "",
        ruc: client.ruc || "",
        ciudad: client.ciudad || "",
        telefono: client.telefono || "",
        email: client.email || "",
        fechaNacimiento: client.fechaNacimiento || "",
      });
    }
  }, [open, client]);

  const validate = () => {
    const e = {};

    FIELDS.forEach(({ key, required }) => {
      if (required && !form[key]?.trim()) e[key] = "Requerido";
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const payload = {
        ...form,
        fechaNacimiento: form.fechaNacimiento?.trim() ? form.fechaNacimiento : null,
      };

      const updated = await editClient(client.id, payload);
      onUpdate(updated);
      onClose();
    } catch (err) {
      console.error("Error al editar el cliente", err);
    }
  };

  const handleClose = () => {
    setErrors({});
    setForm(EMPTY);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} width={560}>
      <div className="space-y-6">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-foreground">
            Editar Cliente
          </h2>
          <p className="text-sm text-muted">
            Modifica los datos del cliente
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FIELDS.map(({ key, label, placeholder, required }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                {label}{" "}
                {required && <span className="text-destructive">*</span>}
              </label>

              <input
                className={[
                  "w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition",
                  "border-border placeholder:text-muted",
                  "focus:border-primary focus:bg-surface",
                  errors[key] ? "border-destructive focus:border-destructive" : "",
                ].join(" ")}
                placeholder={placeholder}
                value={form[key] || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [key]: e.target.value }))
                }
              />

              {errors[key] && (
                <span className="text-xs text-destructive">
                  {errors[key]}
                </span>
              )}
            </div>
          ))}

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">
              Fecha de nacimiento
            </label>

            <input
              type="date"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:bg-surface"
              value={form.fechaNacimiento || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, fechaNacimiento: e.target.value }))
              }
            />

            <span className="text-xs text-muted">
              Este campo es opcional.
            </span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-background"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </Modal>
  );
}