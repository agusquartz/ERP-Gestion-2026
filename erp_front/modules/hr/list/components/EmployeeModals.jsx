"use client";

import { useState, useEffect } from "react";

export function EmployeeModals({ isOpen, onClose, onSave, selectedEmployee = null }) {
  const [isRelativeOpen, setIsRelativeOpen] = useState(false);

  // Formulario Empleado
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("active");
  const [relatives, setRelatives] = useState([]);
  const [salary, setSalary] = useState("");

  // Formulario Pariente Temporal
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
    setNationalId(selectedEmployee.document || "");    
    setBirthDate(selectedEmployee.birthDate || "");    
    setPosition(selectedEmployee.position || "");      
    setStatus(selectedEmployee.status || "active");    
    setRelatives(selectedEmployee.relatives || []);    
    setSalary(selectedEmployee.baseSalary || "");      
  } else {
    setFirstName("");
    setLastName("");
    setNationalId("");
    setBirthDate("");
    setPosition("");
    setStatus("active");
    setRelatives([]);
    setSalary("");
  }
}, [selectedEmployee, isOpen]);

  if (!isOpen) return null;

  const handleAddRelative = (e) => {
    e.preventDefault();
    if (!relFirstName || !relLastName) {
      alert("Por favor, complete nombre y apellido del pariente.");
      return;
    }

    const newRelative = {
      name: relFirstName,
      surname: relLastName,
      document: relNationalId,
      birthDate: relBirthDate,
      relationType: relRelationship,
      disability: relHasDisability,
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

  const handleRemoveRelative = (indexToRemove) => {
  // Filtramos el arreglo manteniendo todos los parientes excepto el que coincida con el índice seleccionado
  setRelatives(relatives.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitEmployee = (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    onSave({
      name: firstName,
      surname: lastName,
      document: nationalId,
      birthDate: birthDate,
      jobTitle: position,
      isActive: status,
      relatives: relatives,
      createdAt: today,
      hireDate: today,
      baseSalary: parseFloat(salary) || 0,
    });
    onClose();
  };

  // Traductor visual de parentesco 
  const getRelationshipLabel = (type) => {
    switch (type) {
      case "spouse": return "Cónyuge";
      case "child": return "Hijo/a";
      case "parent": return "Padre/Madre";
      default: return type;
    }
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
              
              {/* COLUMNA IZQUIERDA */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Nombres</label>
                  <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px] outline-none" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Apellidos</label>
                  <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px] outline-none" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Cédula de Identidad (CI)</label>
                  <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px] outline-none" value={nationalId} onChange={e => setNationalId(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Fecha de nacimiento</label>
                  <input required type="date" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px] outline-none" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                </div>
                {/* UBICACIÓN CORRECTA: Salario Base integrado simétricamente */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Salario Base ($)</label>
                  <input 
                    required
                    type="number" 
                    placeholder="Ej: 2798309"
                    className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px] outline-none font-medium text-slate-800 focus:border-blue-500" 
                    value={salary} 
                    onChange={(e) => setSalary(e.target.value)} 
                  />
                </div>
              </div>

              {/* COLUMNA DERECHA */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Puesto / Cargo</label>
                  <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px] outline-none" value={position} onChange={e => setPosition(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Estado</label>
                  <select className="rounded-[5px] border border-slate-200 px-3 py-2 bg-white text-[14px] outline-none" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>

                {/* Sección Parientes (Figma Flow) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-bold text-slate-700">Parientes</label>
                    <button type="button" onClick={() => setIsRelativeOpen(true)} className="rounded-[4px] bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors">
                      Añadir
                    </button>
                  </div>
                  {/* Lista de Parientes con botón de eliminar */}
                  <div className="min-h-[135px] max-h-[135px] overflow-y-auto rounded-[5px] border border-slate-200 bg-slate-50/70 p-2 space-y-1.5">
                    {relatives.length === 0 ? (
                      <span className="text-slate-400 italic block text-center pt-10 text-[13px]">
                        Ningún pariente cargado aún.
                      </span>
                    ) : (
                      relatives.map((rel, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white border border-slate-200 px-3 py-1.5 rounded shadow-2xs text-[13px]">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{rel.name} {rel.surname}</span>
                            <span className="text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                              {getRelationshipLabel(rel.relationType)}
                            </span>
                          </div>
                          
                          {/* BOTÓN DE ELIMINAR */}
                          <button
                            type="button"
                            onClick={() => handleRemoveRelative(idx)}
                            className="ml-2 p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-50 transition-colors"
                            title="Eliminar pariente"
                          >
                            {/* Un ícono de cruz (X) simple y limpio hecho con SVG */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Acciones del Formulario */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
              <button type="button" onClick={onClose} className="rounded-[5px] border border-slate-300 px-5 py-2 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="rounded-[5px] bg-[#2b6df5] px-5 py-2 text-[14px] font-bold text-white hover:bg-[#1a56db] transition-colors">
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
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm outline-none" value={relFirstName} onChange={e => setRelFirstName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Apellidos</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm outline-none" value={relLastName} onChange={e => setRelLastName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">CI</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm outline-none" value={relNationalId} onChange={e => setRelNationalId(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Fecha de nacimiento</label>
                <input required type="date" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm outline-none" value={relBirthDate} onChange={e => setRelBirthDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Parentesco</label>
                <select className="rounded-[5px] border border-slate-200 px-3 py-1.5 bg-white text-sm outline-none" value={relRelationship} onChange={e => setRelRelationship(e.target.value)}>
                  <option value="spouse">Cónyuge</option>
                  <option value="child">Hijo/a</option>
                  <option value="parent">Padre/Madre</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">¿Posee Discapacidad?</label>
                <select className="rounded-[5px] border border-slate-200 px-3 py-1.5 bg-white text-sm outline-none" value={relHasDisability} onChange={e => setRelHasDisability(e.target.value === "true")}>
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsRelativeOpen(false)} className="rounded-[5px] border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                
                <button type="submit" className="rounded-[5px] bg-[#2b6df5] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1a56db] transition-colors">
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