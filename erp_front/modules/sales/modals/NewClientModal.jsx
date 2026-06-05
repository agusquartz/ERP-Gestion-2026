"use client";

import { useState } from "react";
import { Modal } from "@/shared/components/Modal";
import { createClient } from "../services/saleService";

const FIELDS = [
  { key: "name", label: "Nombre", placeholder: "Ingresa el nombre", required: true },
  { key: "surname", label: "Apellido", placeholder: "Ingresa el apellido", required: true },
  { key: "document", label: "RUC", placeholder: "ej. 1.213.134-5", required: true },
  { key: "address", label: "Ciudad", placeholder: "ej. Asunción", required: true },
  { key: "phone", label: "Teléfono", placeholder: "+595 9xxx xxx", required: true },
  { key: "email", label: "Correo electrónico", placeholder: "examples@gmail.com", required: true },
];

const EMPTY = {
  name: "",
  surname: "",
  document: "",
  address: "",
  phone: "",
  email: "",
  birthDate: "",
};

export function NewClientModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};

    FIELDS.forEach(({ key, required }) => {
      if (required && !form[key].trim()) e[key] = "Requerido";
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const payload = {
        name: form.name,
        surname: form.surname,
        document: form.document,
        address: form.address || null,
        email: form.email,

        birthDate: form.birthDate?.trim()
          ? form.birthDate
          : null,

        creditLimit: 0,

        phones: form.phone
          ? [
              {
                phoneNumber: form.phone,
                isEmergency: false,
              },
            ]
          : [],
      };

      const newClient = await createClient(payload);

      onCreate(newClient);
      setForm(EMPTY);
      setErrors({});
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
      <div className="space-y-6">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-foreground">
            Nuevo Cliente
          </h2>
          <p className="text-sm text-muted">
            Ingresa los datos del nuevo cliente
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
                  "w-full rounded-[5px] border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition",
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
              className="w-full rounded-[5px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:bg-surface"
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

        <p className="text-xs text-muted">
          <span className="text-destructive">*</span> Campo obligatorio
        </p>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-[5px] cursor-pointer border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-background"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-[5px] cursor-pointer bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Crear Cliente
          </button>
        </div>
      </div>
    </Modal>
  );
}