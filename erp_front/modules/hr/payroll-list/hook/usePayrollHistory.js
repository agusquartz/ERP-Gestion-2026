import { useState, useCallback, useEffect } from "react";
import { getPayrollProcesses } from "@/lib/http/client/employees";

export function usePayrollHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayrollProcesses();
      // Validamos las estructuras posibles que devuelva tu cliente HTTP
      const data = response?.payrollProcesses || response?.data || response || [];
      setHistory(data);
    } catch (err) {
      console.error("Error al cargar el historial de nóminas:", err);
      setError("No se pudo obtener el historial de procesos de pago.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loading,
    error,
    refreshHistory: loadHistory
  };
}