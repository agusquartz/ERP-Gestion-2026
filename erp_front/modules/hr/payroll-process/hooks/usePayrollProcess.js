import { useState, useCallback, useMemo, useEffect } from "react";
import { getEmployeesForPayroll, triggerPayroll, updatePayrollStatus, getHistoricalPayroll } from "@/lib/http/client/employees";

export function usePayrollProcess(viewProcessId = null) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del flujo del proceso de nómina
  const [isComputed, setIsComputed] = useState(!!viewProcessId); 
  const [payrollProcessId, setPayrollProcessId] = useState(viewProcessId);
  const [payrollState, setPayrollState] = useState(viewProcessId ? "COMPUTED" : ""); 

  // Periodo de pago
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Búsqueda local en la tabla
  const [search, setSearch] = useState("");

  // IDs excluidos del proceso de pago
  const [excludedIds, setExcludedIds] = useState([]);

  // FUNCIÓN PRINCIPAL DE CARGA DE DATOS (Manejador de Modos)
  const loadPayrollData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      let detectedState = "COMPUTED";
      let detectedStartDate = "";
      let detectedEndDate = "";
      
      if (viewProcessId) {
        // ==========================================
        // MODO LECTURA / AUDITORÍA HISTÓRICA
        // ==========================================
        const response = await getHistoricalPayroll(viewProcessId);
        data = Array.isArray(response) ? response : response?.data || response?.employees || [];

        // Buscamos el estado real y las fechas en el primer registro que tenga historial
        const firstEmployee = data[0] || {};
        const firstSummary = firstEmployee.payrollSummary || firstEmployee.payroll_summary;
        
        if (firstSummary) {
          // 1. Mapeo estricto y resiliente del estado (Rust enum string serialization)
          // Soporta: state, status, process_state, process_status tanto en mayúsculas como minúsculas
          const rawState = firstSummary.state || firstSummary.status || firstSummary.processState || firstSummary.process_state || "COMPUTED";
          detectedState = String(rawState).toUpperCase(); 
          
          // 2. Control total de fechas con Fallbacks por si vienen nulas en nóminas liquidadas (PAID)
          const rawDate = firstSummary.payrollProcessStartDate || 
                          firstSummary.payroll_process_start_date || 
                          firstSummary.createdAt || 
                          firstSummary.created_at;

          if (rawDate && typeof rawDate === "string") {
            detectedStartDate = rawDate.split("T")[0];
            detectedEndDate = rawDate.split("T")[0]; 
          }
        }

        // Si por alguna razón el backend no adjuntó metadatos en el summary, extraemos del objeto global
        if (!detectedStartDate && (response?.startDate || response?.start_date)) {
          detectedStartDate = response.startDate || response.start_date;
          detectedEndDate = response.endDate || response.end_date;
        }

      } else {
        // ==========================================
        // MODO CREACIÓN ACTIVA (Flujo Normal)
        // ==========================================
        const response = await getEmployeesForPayroll();
        data = response?.employees || response?.data?.employees || response || [];
        detectedState = "";
      }

      // Proceso de normalización unificado (sirve para ambos modos)
      const normalized = data.map((emp) => {
        const summary = emp.payrollSummary || emp.payroll_summary || {};
        const backendGross = summary.grossAmount ?? summary.gross_amount ?? null;
        const backendDeductions = summary.deductions ?? summary.deductions_amount ?? null;
        const backendNet = summary.netEarnings ?? summary.net_earnings ?? null;
        const lastComputed = summary.lastTimeComputed || summary.last_time_computed || null;
        const backendItems = summary.items || [];

        // Extraemos los créditos/ingresos (Signo "C")
        const defaultEarnings = backendItems
          .filter((item) => item.sign === "C")
          .map((item) => ({
            description: item.noveltyName || item.novelty_name || "Ingreso computado",
            quantity: Number(item.quantity) || 1,
            unitAmount: Number(item.unitAmount || item.unit_amount) || 0,
            totalAmount: Number(item.totalAmount || item.total_amount) || 0,
          }));

        // Extraemos los débitos/deducciones (Signo "D")
        const defaultDeductionItems = backendItems
          .filter((item) => item.sign === "D")
          .map((item) => ({
            description: item.noveltyName || item.novelty_name || "Deducción computada",
            quantity: Number(item.quantity) || 1,
            unitAmount: Number(item.unitAmount || item.unit_amount) || 0,
            totalAmount: Number(item.totalAmount || item.total_amount) || 0,
          }));

        // Salvaguarda por si no hay ítems detallados pero sí un monto bruto
        if (defaultEarnings.length === 0 && backendGross > 0) {
          defaultEarnings.push({
            description: "Salario Base",
            quantity: 1,
            unitAmount: Number(backendGross),
            totalAmount: Number(backendGross),
          });
        }

        return {
          id: emp.id,
          first_name: emp.name || "Sin nombre",
          last_name: emp.surname || "",
          position: emp.jobTitle || emp.job_title || "Sin especificar",
          baseSalary: emp.currentContract?.salary || emp.current_contract?.salary || 0,
          isActive: emp.isActive ?? emp.is_active ?? true,
          relatives: emp.relatives || [],
          currentContract: emp.currentContract || emp.current_contract || null,
          earnings: defaultEarnings,
          deductionItems: defaultDeductionItems,
          grossIncome: backendGross,
          deductions: backendDeductions,
          netIncome: backendNet,
          lastTimeComputed: lastComputed,
        };
      });

      // Sincronizamos todos los estados juntos al final de manera atómica
      setEmployees(normalized);
      
      if (viewProcessId) {
        setIsComputed(true);
        setPayrollState(detectedState);
        // Aseguramos valores string para que los inputs tipo fecha no provoquen resets involuntarios
        setStartDate(detectedStartDate || "-----");
        setEndDate(detectedEndDate || "-----");
      } else {
        setPayrollState("");
      }

    } catch (err) {
      console.error("Error al cargar datos en usePayrollProcess:", err);
      setError("Ocurrió un error al procesar la información de la nómina.");
    } finally {
      setLoading(false);
    }
  }, [viewProcessId]);

  // DISPARADOR DE CARGA AL INICIAR EL COMPONENTE
  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  // FUNCIÓN COMPUTAR: Envía el estado actual como COMPUTED al backend
  const computePayroll = useCallback(async () => {
    if (viewProcessId) return;

    if (!startDate || !endDate) {
      setError("Debe definir el período de pago antes de computar.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        start_date: startDate,
        end_date: endDate,
        pay_date: endDate,
        excluded_employee_ids: excludedIds.length > 0 ? excludedIds : null,
      };

      const payrollRes = await triggerPayroll(payload);
      const processId = payrollRes?.payroll_process_id || payrollRes?.data?.payroll_process_id || payrollRes?.id;
      
      if (processId) {
        setPayrollProcessId(processId);
      }
      setIsComputed(true);
      setPayrollState("COMPUTED");
    } catch (err) {
      console.error("Error al computar nómina:", err);
      setError("Ocurrió un error al registrar el cómputo en el servidor.");
      setIsComputed(false);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, excludedIds, viewProcessId]);

  // Manejadores de cambios de fechas
  const handleSetStartDate = (val) => {
    if (viewProcessId) return;
    setStartDate(val);
    setIsComputed(false);
    setPayrollProcessId(null);
    setPayrollState("");
  };

  const handleSetEndDate = (val) => {
    if (viewProcessId) return;
    setEndDate(val);
    setIsComputed(false);
    setPayrollProcessId(null);
    setPayrollState("");
  };

  // CONTROL DE CAMBIOS EN LOS CHECKS DE LA TABLA
  const toggleEmployee = (id) => {
    if (viewProcessId) return;
    setIsComputed(false);       
    setPayrollProcessId(null);   
    setPayrollState("");
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = (allIds) => {
    if (viewProcessId) return;
    setIsComputed(false);       
    setPayrollProcessId(null);   
    setPayrollState("");
    if (excludedIds.length === 0) {
      setExcludedIds(allIds);
    } else {
      setExcludedIds([]);
    }
  };

  // FUNCIÓN PAGAR: Ejecuta el cierre definitivo pasando a "paid"
  const runPayroll = async () => {
    const activeProcessId = viewProcessId || payrollProcessId;

    if (!activeProcessId) {
      return { success: false, error: "Debe volver a computar los cambios antes de pagar." };
    }

    setIsSubmitting(true);
    try {
      const response = await updatePayrollStatus(activeProcessId, { action: "paid" });
      setPayrollState("PAID");
      return { success: true, data: response };
    } catch (err) {
      console.error("Error al procesar el pago definitivo:", err);
      return { success: false, error: err?.message || "Error al asentar el pago." };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtro de búsqueda local de empleados en la tabla
  const filteredEmployees = employees.filter((emp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      emp.first_name.toLowerCase().includes(q) ||
      emp.last_name.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  // Suma totalizadora reactiva basada en exclusiones vigentes
  const totalPayrollAmount = useMemo(() => {
    return employees
      .filter((emp) => !excludedIds.includes(emp.id))
      .reduce((sum, emp) => sum + (Number(emp.netIncome) || 0), 0);
  }, [employees, excludedIds]);

  const selectedCount = employees.length - excludedIds.length;

  return {
    employees: filteredEmployees,
    allEmployees: employees,
    loading,
    error,
    isSubmitting,
    isComputed,
    payrollState,                 
    isReadOnly: !!viewProcessId,  
    search,
    setSearch,
    startDate,
    setStartDate: handleSetStartDate,
    endDate,
    setEndDate: handleSetEndDate,
    excludedIds,
    toggleEmployee,
    toggleAll,
    computePayroll,
    runPayroll,
    selectedCount,
    totalPayrollAmount,
  };
}