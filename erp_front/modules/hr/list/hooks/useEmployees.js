import { useState, useEffect, useCallback } from "react";
import { 
  getEmployeesByQuery, 
  createEmployee as apiCreateEmployee, 
  patchEmployee, 
} from "@/lib/http/client/employees";

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtros de control: Inicializamos en "all" para que cargue todos al iniciar
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); 
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const loadEmployees = useCallback(async (currentSearch, currentStatus, currentCursor) => {
    setLoading(true);
    setError(null);
    try {
      // Determinamos el filtro real para el backend de Rust
      const backendStatus = (currentStatus === "all" || currentStatus === "Todos" || !currentStatus) 
        ? "" 
        : currentStatus;

      const response = await getEmployeesByQuery({
        search: currentSearch,
        status: backendStatus,
        cursor: currentCursor,
        limit: 30,
      });

      console.log("Respuesta cruda:", response);
      const employeesData = response?.employees || response.data?.employees || [];
      const hasMoreData = response?.hasMore || response.data?.hasMore || false;
      const nextCursor = response?.nextCursor || response.data?.nextCursor || null;

      if (currentCursor) {
        setEmployees((prev) => [...prev, ...employeesData]);
      } else {
        setEmployees(employeesData);
      }

      setHasMore(hasMoreData);
      setCursor(nextCursor);

    } catch (err) {
      console.error("Error al cargar empleados:", err);
      setError("Ocurrió un error al traer los datos del personal.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce para evitar sobrecargar el backend al tipear
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadEmployees(search, status, null);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, status, loadEmployees]);

  const loadMore = () => {
    if (!loading && hasMore && cursor) {
      loadEmployees(search, status, cursor);
    }
  };

  const createEmployee = async (payload) => {
    setIsSubmitting(true);
    try {
      const response = await apiCreateEmployee(payload);
      await loadEmployees(search, status, null);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateEmployee = async (id, payload) => {
    setIsSubmitting(true);
    try {
      const response = await patchEmployee(id, payload);
      await loadEmployees(search, status, null);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err };
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateEmployeeStatus(id, nextStatus);
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, status: nextStatus } : emp))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return {
    employees,
    loading,
    error,
    isSubmitting,
    search,
    setSearch,
    status,
    setStatus,
    hasMore,
    loadMore,
    createEmployee,
    updateEmployee,
    toggleStatus,
    refetch: () => loadEmployees(search, status, null),
  };
}