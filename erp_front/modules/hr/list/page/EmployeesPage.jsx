"use client";

import { useState } from "react";
import { EmployeeFilters } from "../components/EmployeeFilters";
import { EmployeeTable } from "../components/EmployeeTable";
import { EmployeeModals } from "../components/EmployeeModals";
import { useEmployees } from "../hooks/useEmployees";

export default function EmployeesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const {
    employees,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    hasMore,
    loadMore,
    createEmployee,
    updateEmployee,
  } = useEmployees();

  // Mapeamos los datos de red con redundancia defensiva
  const normalizedEmployees = (employees || []).map(emp => {
    // Corregido: isActive es booleano, no hay campo "status"
    let calculatedStatus = "active";
    if (emp.is_active !== undefined) {
      calculatedStatus = emp.is_active ? "active" : "inactive";
    } else if (emp.isActive !== undefined) {         
      calculatedStatus = emp.isActive ? "active" : "inactive";
    }

    return {
      id: emp.id,
      first_name: emp.name || emp.first_name || "Sin nombre",
      last_name: emp.surname || emp.last_name || "",
      position: emp.jobTitle || emp.job_title || emp.position || "Sin especificar",
      status: calculatedStatus,
      birthDate: emp.birthDate || emp.birth_date || "",
      document: emp.document || "",
      baseSalary: emp.currentContract?.salary || emp.baseSalary || emp.base_salary || 0,
      relatives: emp.relatives || []
    };
  });

  const handleSaveEmployee = async (payload) => {
    try {
      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.id, payload);
      } else {
        await createEmployee(payload);
      }
      setIsModalOpen(false);
      setSelectedEmployee(null);
    } catch (err) {
      alert("Error al guardar cambios: " + err.message);
    }
  };

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleNewEmployeeClick = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const hasRecords = normalizedEmployees.length > 0;

  return (
    <div className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-24px)] md:h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:p-4 md:p-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Empleados</h1>
        <p className="text-sm text-slate-500">Gestión de personal</p>
      </div>

      <div className="w-full bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        
        {/* Filtros */}
        <EmployeeFilters 
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          onNewEmployeeClick={handleNewEmployeeClick} 
        />

        {/* Tabla de Empleados */}
        <EmployeeTable 
          employees={normalizedEmployees} 
          loading={loading} 
          error={error}
          onEdit={handleEditClick}
          onView={(emp) => console.log("Visualizar ficha:", emp)}
        />

        {/* Paginación */}
        {!loading && !error && hasMore && hasRecords && (
          <div className="flex justify-center pt-2">
            <button
              onClick={loadMore}
              className="rounded-[5px] border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            >
              Cargar más registros
            </button>
          </div>
        )}
      </div>

      {/* Modales unificados */}
      <EmployeeModals 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEmployee}
        selectedEmployee={selectedEmployee}
      />
    </div>
  );
}