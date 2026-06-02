"use client";

import { useState } from "react";

export function EmployeeModals({ isOpen, onClose, onSave }) {
  const [isRelativeOpen, setIsRelativeOpen] = useState(false);
  
  // Formulario Empleado
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [ci, setCi] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [puesto, setPuesto] = useState("");
  const [estado, setEstado] = useState("Activo");
  const [parientes, setParientes] = useState([]); // Array de sub-objetos

  // Formulario Pariente Temporal
  const [relNombres, setRelNombres] = useState("");
  const [relApellidos, setRelApellidos] = useState("");
  const [relCi, setRelCi] = useState("");
  const [relFechaNac, setRelFechaNac] = useState("");
  const [relParentesco, setRelParentesco] = useState("Conyuge");
  const [relDiscapacidad, setRelDiscapacidad] = useState("No");

  if (!isOpen) return null;

  const handleAddRelative = (e) => {
    e.preventDefault();
    const newRelative = {
      nombres: relNombres,
      apellidos: relApellidos,
      ci: relCi,
      fecha_nacimiento: relFechaNac,
      parentesco: relParentesco,
      discapacidad: relDiscapacidad,
    };
    setParientes([...parientes, newRelative]);
    
    // Resetear formulario interno y cerrar modal secundario
    setRelNombres(""); setRelApellidos(""); setRelCi(""); setRelFechaNac("");
    setIsRelativeOpen(false);
  };

  const handleSubmitEmployee = (e) => {
    e.preventDefault();
    onSave({
      nombres,
      apellidos,
      ci,
      fecha_nacimiento: fechaNac,
      puesto,
      estado,
      parientes,
    });
    // Reset total
    setNombres(""); setApellidos(""); setCi(""); setFechaNac(""); setPuesto(""); setParientes([]);
    onClose();
  };

  return (
    <>
      {/* MODAL PRINCIPAL: NUEVO EMPLEADO */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Nuevo Empleado</h2>
          <div className="my-4 border-b border-slate-200" />

          <form onSubmit={handleSubmitEmployee} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Nombres</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px]" value={nombres} onChange={e => setNombres(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Puesto</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px]" value={puesto} onChange={e => setPuesto(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Apellidos</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px]" value={apellidos} onChange={e => setApellidos(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Estado</label>
                <select className="rounded-[5px] border border-slate-200 px-3 py-2 bg-white text-[14px]" value={estado} onChange={e => setEstado(e.target.value)}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">CI</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px]" value={ci} onChange={e => setCi(e.target.value)} />
              </div>

              {/* Sección Parientes (Figma Flow) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-slate-700">Parientes</label>
                  <button type="button" onClick={() => setIsRelativeOpen(true)} className="rounded-[4px] bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200">
                    Añadir
                  </button>
                </div>
                <div className="min-h-[42px] max-h-[100px] overflow-y-auto rounded-[5px] border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                  {parientes.length === 0 ? (
                    <span className="text-slate-400 italic">Ningún pariente cargado aún.</span>
                  ) : (
                    <div className="space-y-1">
                      {parientes.map((p, idx) => (
                        <div key={idx} className="flex justify-between bg-white border px-2 py-1 rounded">
                          <span>{p.nombres} {p.apellidos} ({p.parentesco})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">Fecha de nacimiento</label>
                <input required type="date" className="rounded-[5px] border border-slate-200 px-3 py-2 text-[14px]" value={fechaNac} onChange={e => setFechaNac(e.target.value)} />
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
              <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-700">Nombres</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm" value={relNombres} onChange={e => setRelNombres(e.target.value)} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-700">Apellidos</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm" value={relApellidos} onChange={e => setRelApellidos(e.target.value)} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-700">CI</label>
                <input required type="text" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm" value={relCi} onChange={e => setRelCi(e.target.value)} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-700">Fecha de nacimiento</label>
                <input required type="date" className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-sm" value={relFechaNac} onChange={e => setRelFechaNac(e.target.value)} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-700">Parentesco</label>
                <select className="rounded-[5px] border border-slate-200 px-3 py-1.5 bg-white text-sm" value={relParentesco} onChange={e => setRelParentesco(e.target.value)}>
                  <option value="Conyuge">Cónyuge</option><option value="Hijo/a">Hijo/a</option><option value="Padre/Madre">Padre/Madre</option>
                </select></div>
              <div className="flex flex-col gap-1"><label className="text-xs font-bold text-slate-700">Discapacidad</label>
                <select className="rounded-[5px] border border-slate-200 px-3 py-1.5 bg-white text-sm" value={relDiscapacidad} onChange={e => setRelDiscapacidad(e.target.value)}>
                  <option value="No">No</option><option value="Si">Sí</option>
                </select></div>

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