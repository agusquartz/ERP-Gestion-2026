import { clientRequest } from "./request";

/**
 * Obtiene la lista de empleados con filtros y paginación.
 */
export function getEmployeesByQuery({ search, status, cursor, limit } = {}) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (status) query.set("status", status);
    if (cursor) query.set("cursor", cursor);
    if (limit) query.set("limit", limit);

    const queryString = query.toString();

    return clientRequest(`/hr/employees${queryString ? `?${queryString}` : ""}`,
        {
            method: "GET",
        });
}

/**
 * Crea un nuevo empleado (incluyendo datos personales y parientes).
 */
export function createEmployee(payload) {
  return clientRequest("/hr/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Obtiene el detalle completo de un empleado por su ID.
 */
export function getEmployeeById(id) {
    return clientRequest(`/hr/employees/${id}`, {
        method: "GET",
    });
}

/**
 * Actualiza los datos de un empleado.
 */
export function patchEmployee(id, payload) {
    // Mantenemos la estructura de rutas coherente con tu backend en Rust
    return clientRequest(`/hr/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

/**
 * Cambia el estado de un proceso de pago (pasa de Computado a pagado, pero se debe enviar en ingles).
 */
export function updatePayrollStatus(id, action) {
    // Aseguramos que si viene "PAID", se convierta a "paid" para cumplir con el #[serde(rename_all = "lowercase")]
    const cleanAction = typeof action === 'string' ? action.toLowerCase() : action?.action?.toLowerCase();

    return clientRequest(`/hr/payroll/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ action: cleanAction}),
    });
}

export function getEmployeesForPayroll() {
  return clientRequest("/hr/employees?limit=1000&status=active", { method: "GET" });
}

export function triggerPayroll(payload) {
  return clientRequest("/hr/payroll/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Trae el historial de todos los procesos de nómina ejecutados.
 */
export function getPayrollProcesses() {
  return clientRequest("/hr/payroll", { 
    method: "GET" 
  });
}

/**
 * Obtiene el detalle de empleados y sus liquidaciones calculadas para un proceso histórico.
 * Apunta a: /hr/payroll/{process_id}/receipts
 */
export function getHistoricalPayroll(processId) {
  return clientRequest(`/hr/payroll/${processId}/receipts`, {
    method: "GET",
  });
}