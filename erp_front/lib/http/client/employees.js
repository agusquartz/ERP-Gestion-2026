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
 * Cambia el estado de un empleado (ej. pasar a Inactivo).
 */
export function updateEmployeeStatus(id, status) {
    return clientRequest(`/hr/employees/${id}/${status}`, {
        method: "POST",
        body: JSON.stringify({ status }),
    });
}