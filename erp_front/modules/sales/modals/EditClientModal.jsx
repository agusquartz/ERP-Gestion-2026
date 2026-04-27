
"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/shared/components/Modal";
import { editClient } from "../services/saleService";

const FIELDS = [
  { key: "name", label: "Nombre", placeholder: "Ingresa el nombre", required: true },
  { key: "surname", label: "Apellido", placeholder: "Ingresa el apellido", required: true },
  { key: "document", label: "Documento", placeholder: "ej. 1.213.134-5", required: true },
  { key: "address", label: "Dirección", placeholder: "ej. Asunción", required: true },
  { key: "phone", label: "Teléfono", placeholder: "+595 9xxx xxx", required: true },
  { key: "email", label: "Correo electrónico", placeholder: "example@gmail.com", required: true },
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

export function EditClientModal({ open, onClose, client, onUpdate }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && client) {
      setForm({
        name: client.name || "",
        surname: client.surname || "",
        document: client.document || "",
        address: client.address || "",
        phone: client.phones?.[0]?.phoneNumber || "",
        email: client.email || "",
        birthDate: client.birthDate || "",
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
        name: form.name,
        surname: form.surname,
        document: form.document,
        address: form.address,
        email: form.email,
        birthDate: form.birthDate?.trim() ? form.birthDate : undefined,

        phones: form.phone
          ? [
              {
                id: client.phones?.[0]?.id || 0,
                phoneNumber: form.phone,
                isEmergency: false,
              },
            ]
          : undefined,
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

        {/* Title and Subtitle */}
        <div>
          <h2 className="mb-1 text-2xl font-bold text-foreground">
            Editar Cliente
          </h2>
          <p className="text-sm text-muted">
            Modifica los datos del cliente
          </p>
        </div>


        {/* Required Fields for Client Update */}
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
              value={form.birthDate || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, birthDate: e.target.value }))
              }
            />

            <span className="text-xs text-muted">
              Este campo es opcional.
            </span>
          </div>
        </div>


        {/* Buttons section */}
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
            Guardar cambios
          </button>
        </div>
      </div>
    </Modal>
  );
}