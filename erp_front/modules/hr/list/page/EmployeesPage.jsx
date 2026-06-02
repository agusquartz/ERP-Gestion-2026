"use client";

import { useState } from "react";
import { EmployeeFilters } from "../components/EmployeeFilters";
import { EmployeeTable } from "../components/EmployeeTable";
import { EmployeeModals } from "../components/EmployeeModals";
import { Pagination } from "@/modules/purchases/purchase-invoices/list/components/Pagination"; // Reutilizamos tu componente global de paginación
import { useEmployees } from "../hooks/useEmployees";

export function EmployeesPage() {
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    employees,
    loading,
    error,
    currentPage,
    hasMore,
    totalPages,
    goToPage,
    addEmployee,
  } = useEmployees(filters);

  const handleSearch = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSaveEmployee = async (payload) => {
    try {
      await addEmployee(payload);
    } catch (err) {
      alert("Error al guardar el empleado: " + err.message);
    }
  };

  return (
    <div className="w-full p-6 space-y-4">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Empleados</h1>
        <p className="text-sm text-slate-500">Gestión de personal, contratos y nóminas</p>
      </div>

      <div className="border-b border-slate-200 w-full" />

      {/* Componente Filtros y Botón de Nuevo */}
      <EmployeeFilters 
        onSearch={handleSearch} 
        onNewEmployeeClick={() => setIsModalOpen(true)} 
      />

      {/* Tabla Principal */}
      <EmployeeTable 
        employees={employees} 
        loading={loading} 
        error={error}
        onEdit={(emp) => console.log("Editar", emp)}
        onView={(emp) => console.log("Ver", emp)}
      />

      {/* Paginación Reutilizada */}
      {!loading && !error && employees.length > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          hasMore={hasMore}
          goToPage={goToPage}
        />
      )}

      {/* Modales de Flujo Cruzado (Figma) */}
      <EmployeeModals 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEmployee}
      />
    </div>
  );
}