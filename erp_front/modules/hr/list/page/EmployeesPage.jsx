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
      relatives: emp.relatives || [],
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
    // CAMBIO: contenedor principal igual al estilo de DocumentsPage
    <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
      {/* CAMBIO: header principal estilo DocumentsPage */}
      <div className="mb-5 shrink-0">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
          Empleados
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Consultá y gestioná el personal registrado.
        </p>

        <div className="mt-2 h-px w-full bg-border" />
      </div>

      {/* CAMBIO: filtros separados del marco de tabla, como DocumentsSearch */}
      <div className="shrink-0">
        <EmployeeFilters
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          onNewEmployeeClick={handleNewEmployeeClick}
        />
      </div>

      {/* CAMBIO: área de tabla con altura controlada para que no empuje la pantalla */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <EmployeeTable
          employees={normalizedEmployees}
          loading={loading}
          error={error}
          onEdit={handleEditClick}
          onView={(emp) => console.log("Visualizar ficha:", emp)}
        />
      </div>

      {/* CAMBIO: paginación abajo, fija dentro del layout */}
      {!loading && !error && hasMore && hasRecords && (
        <div className="mt-4 flex shrink-0 justify-center">
          <button
            onClick={loadMore}
            className="rounded-[8px] border border-slate-300 px-6 py-2.5 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
          >
            Cargar más registros
          </button>
        </div>
      )}

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