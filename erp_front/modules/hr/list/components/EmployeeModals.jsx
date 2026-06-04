"use client";

import { useState, useEffect } from "react";

export function EmployeeModals({ isOpen, onClose, onSave, selectedEmployee = null }) {
  const [isRelativeOpen, setIsRelativeOpen] = useState(false);
  
  // Formulario Empleado (English state variables)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("active");
  const [relatives, setRelatives] = useState([]);

  // Formulario Pariente Temporal (English state variables)
  const [relFirstName, setRelFirstName] = useState("");
  const [relLastName, setRelLastName] = useState("");
  const [relNationalId, setRelNationalId] = useState("");
  const [relBirthDate, setRelBirthDate] = useState("");
  const [relRelationship, setRelRelationship] = useState("spouse");
  const [relHasDisability, setRelHasDisability] = useState(false);

  // Cargar datos en caso de edición
  useEffect(() => {
    if (selectedEmployee) {
      setFirstName(selectedEmployee.first_name || "");
      setLastName(selectedEmployee.last_name || "");
      setNationalId(selectedEmployee.national_id || "");
      setBirthDate(selectedEmployee.birth_date || "");
      setPosition(selectedEmployee.position || "");
      setStatus(selectedEmployee.status || "active");
      setRelatives(selectedEmployee.relatives || []);
    } else {
      setFirstName("");
      setLastName("");
      setNationalId("");
      setBirthDate("");
      setPosition("");
      setStatus("active");
      setRelatives([]);
    }
  }, [selectedEmployee, isOpen]);

  if (!isOpen) return null;

  const handleAddRelative = (e) => {
    e.preventDefault();
    const newRelative = {
      name: relFirstName,
      surname: relLastName,
      document: relNationalId,
      birthDate: relBirthDate,
      relationType: relRelationship,
      isability: relHasDisability,
    };
    setRelatives([...relatives, newRelative]);
    
    // Resetear formulario interno de pariente
    setRelFirstName(""); 
    setRelLastName(""); 
    setRelNationalId(""); 
    setRelBirthDate("");
    setRelRelationship("spouse");
    setRelHasDisability(false);
    setIsRelativeOpen(false);
  };

  const handleSubmitEmployee = (e) => {
    e.preventDefault();
    onSave({
      name: firstName,
      surname: lastName,
      document: nationalId,
      birthDate: birthDate,
      jobTitle: position,
      isActive: status,
      relatives: relatives,
    });
    onClose();
  };

  return (
    <>
      {/* MODAL PRINCIPAL: NUEVO / EDITAR EMPLEADO */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {selectedEmployee ? "Modificar Empleado" : "Nuevo Empleado"}
          </h2>
          <div className="my-4 border-b border-slate-200" />

          <form onSubmit={handleSubmitEmployee} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Nombres</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px]" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Puesto / Cargo</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px]" value={position} onChange={e => setPosition(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Apellidos</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px]" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Estado</label>
                <select className="rounded-[5px] border border-slate-200 px-3 py-2 bg-white text-[14px]" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Cédula de Identidad (CI)</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px]" value={nationalId} onChange={e => setNationalId(e.target.value)} />
              </div>

              {/* Sección Parientes */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-slate-700">Parientes</label>
                  <button type="button" onClick={() => setIsRelativeOpen(true)} className="rounded-[4px] bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200">
                    Añadir
                  </button>
                </div>
                <div className="min-h-[42px] max-h-[100px] overflow-y-auto rounded-[5px] border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                  {relatives.length === 0 ? (
                    <span className="text-slate-400 italic">Ningún pariente cargado aún.</span>
                  ) : (
                    <div className="space-y-1">
                      {relatives.map((rel, idx) => (
                        <div key={idx} className="flex justify-between bg-white border px-2 py-1 rounded">
                          <span>{rel.first_name} {rel.last_name} ({rel.relationship})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Fecha de nacimiento</label>
                <input required type="date" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px]" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={onClose} className="rounded-[5px] border border-slate-300 px-5 py-2 text-[14px] font-bold text-slate-700 hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" className="rounded-[5px] bg-[#2b6df5] px-5 py-2 text-[14px] font-bold text-white hover:bg-[#1a56db]">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL SECUNDARIO SUPERPUESTO (Parientes) */}
      {isRelativeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl border border-slate-200 md:translate-x-12 translate-y-4">
            <h3 className="text-xl font-bold text-slate-900">Parientes</h3>
            <div className="my-3 border-b border-slate-200" />

            <form onSubmit={handleAddRelative} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Nombres</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm" value={relFirstName} onChange={e => setRelFirstName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Apellidos</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm" value={relLastName} onChange={e => setRelLastName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">CI</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm" value={relNationalId} onChange={e => setRelNationalId(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Fecha de nacimiento</label>
                <input required type="date" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm" value={relBirthDate} onChange={e => setRelBirthDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Parentesco</label>
                <select className="rounded-[5px] border border-slate-200 px-3 py-1.5 bg-white text-sm" value={relRelationship} onChange={e => setRelRelationship(e.target.value)}>
                  <option value="spouse">Cónyuge</option>
                  <option value="child">Hijo/a</option>
                  <option value="parent">Padre/Madre</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">¿Posee Discapacidad?</label>
                <select className="rounded-[5px] border border-slate-200 px-3 py-1.5 bg-white text-sm" value={relHasDisability} onChange={e => setRelHasDisability(e.target.value === "true")}>
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsRelativeOpen(false)} className="rounded-[5px] border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" className="rounded-[5px] bg-[#2b6df5] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1a56db]">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}