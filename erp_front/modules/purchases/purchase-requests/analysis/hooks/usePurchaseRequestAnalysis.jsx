// modules/purchases/purchase-requests/analysis/hooks/usePurchaseRequestAnalysis.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { getPurchaseRequestById } from "@/lib/http/client/purchase-request";

export function usePurchaseRequestAnalysis(requestId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getPurchaseRequestById(requestId);
      setData(result);
    } catch (err) {
      setError(err.message || "Error al cargar la solicitud");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}