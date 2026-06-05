"use client";

import { useState } from "react";
import { PayrollFilters } from "../components/PayrollFilters";
import { PayrollTable } from "../components/PayrollTable";
import { PayrollDetailModal } from "../components/PayrollDetailModal";
import { usePayrollProcess } from "../hooks/usePayrollProcess";
import { formatCurrency } from "../components/utils";

export default function PayrollProcessPage() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    employees,
    allEmployees,
    loading,
    error,
    isSubmitting,
    isComputed,
    payrollState, // Desestructurado correctamente para evitar el ReferenceError
    search,
    setSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    excludedIds,
    toggleEmployee,
    toggleAll,
    computePayroll,
    runPayroll,
    selectedCount,
    totalPayrollAmount,
  } = usePayrollProcess();

  const handleViewEmployee = (emp) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleFinalizarPago = async () => {
    const result = await runPayroll();
    if (result.success) {
      alert("Nómina liquidada exitosamente. El estado ha cambiado a PAID.");
    } else {
      alert(`Error al procesar el pago: ${result.error}`);
    }
  };

  return (
    /* CONTENEDOR BLANCO FIJO UNIFICADO h-[calc(100vh-140px)] */
    <div className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-24px)] md:h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:p-4 md:p-6">
      
      {/* SECCIÓN 1: CABECERA / TÍTULO */}
      <div className="mb-5">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px] ">
          Proceso de Pago
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de nómina y proceso de pago mensual activo
       </p>
        <div className="mt-2 h-px w-full bg-border" />
      </div>

      {/* SECCIÓN 2: FILTROS Y CONFIGURACIÓN DE PERÍODO */}
        <PayrollFilters
          search={search}
          setSearch={setSearch}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onCompute={computePayroll}
          loading={loading}
        />

      {/* SECCIÓN 3: TABLA ENMARCADA POR DENTRO CON SCROLL INDEPENDIENTE */}
      <div className="flex-1 px-6 pb-4 pt-4 min-h-0 flex flex-col space-y-3">
        
        {/* Alerta de cambios pendientes (UX Helper) */}
        {!isComputed && allEmployees.length > 0 && startDate && endDate && (
          <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-[5px] px-4 py-2 text-[13px] font-medium flex-shrink-0">
            Has realizado modificaciones en la selección o en las fechas. Debes presionar de nuevo <strong>"Computar Período"</strong> para actualizar los datos en el servidor antes de proceder a pagar.
          </div>
        )}

        {/* El marco interno de la tabla */}
        <div className="flex-1 w-full rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-xs min-h-0">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <PayrollTable
              employees={employees}
              loading={loading}
              error={error}
              excludedIds={excludedIds}
              onToggleEmployee={toggleEmployee}
              onToggleAll={toggleAll}
              onView={handleViewEmployee}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: TOTALIZADOR / PIE DE PÁGINA PERMANENTE */}
      {!loading && !error && allEmployees.length > 0 && (
        <div className="bg-[#f8fafc] border-t border-slate-200 px-6 py-4 flex items-center justify-between relative z-20 flex-shrink-0 flex-wrap gap-4">
          
          {/* Detalles Informativos */}
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center rounded-[5px] bg-[#2b6df5]/10 px-3 py-1.5 text-[13px] font-bold text-[#2b6df5]">
              {selectedCount} SELECCIONADOS
            </span>
            <div className="text-[14px] text-slate-600">
              Total Estimado a Transferir: <span className="font-extrabold text-slate-900 text-lg ml-1">{formatCurrency(totalPayrollAmount)}</span>
            </div>
          </div>

          {/* Botón de Acción Principal */}
          <button
            type="button"
            onClick={handleFinalizarPago}
            disabled={isSubmitting || !isComputed || payrollState?.toLowerCase() === "paid" || selectedCount === 0}
            className="rounded-[5px] bg-[#2b6df5] px-6 py-2.5 text-[14px] font-bold text-white shadow-sm hover:bg-[#1a56db] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Procesando Pago..." : "Pagar Nómina"}
          </button>
        </div>
      )}

      <PayrollDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        employee={selectedEmployee}
      />
    </div>
  );
}