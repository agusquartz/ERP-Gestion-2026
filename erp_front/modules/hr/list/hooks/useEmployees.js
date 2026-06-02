import { useState, useEffect, useCallback } from "react";
import { fetchEmployees, createEmployee } from "@/lib/http/client/hr.js"; 

const PAGE_SIZE = 30;

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useEmployees(filters) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [cursors, setCursors] = useState([undefined]);

  const debouncedSearch = useDebounce(filters.search, 400);

  useEffect(() => {
    setCurrentPage(1);
    setCursors([undefined]);
  }, [debouncedSearch, filters.status]);

  const loadEmployees = useCallback(async () => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    try {
      const cursor = cursors[currentPage - 1];
      const response = await fetchEmployees({
        search: debouncedSearch || undefined,
        status: filters.status || undefined,
        cursor: cursor,
        limit: PAGE_SIZE,
      });

      if (!cancelled) {
        setEmployees(response.data ?? []);
        setHasMore(response.hasMore ?? false);

        if (response.hasMore && response.nextCursor != null) {
          setCursors((prev) => {
            if (prev[currentPage] == null) {
              const next = [...prev];
              next[currentPage] = response.nextCursor;
              return next;
            }
            return prev;
          });
        }
      }
    } catch (e) {
      if (!cancelled) setError(e.message);
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => { cancelled = true; };
  }, [currentPage, cursors, debouncedSearch, filters.status]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && (page < currentPage || cursors[page - 1] != null || page === 1)) {
      setCurrentPage(page);
    }
  }, [currentPage, cursors]);

  const addEmployee = async (payload) => {
    await createEmployee(payload);
    await loadEmployees(); // Mutar y recargar la lista limpia de la página 1
  };

  return {
    employees,
    loading,
    error,
    currentPage,
    hasMore,
    totalPages: cursors.length,
    goToPage,
    addEmployee,
  };
}