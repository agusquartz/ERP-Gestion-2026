/**
 * @file usePurchaseRequestAnalysis.js
 * @module modules/purchases/purchase-requests/analysis/hooks
 *
 * @description
 * Data-fetching hook for the Purchase Request Analysis page.
 *
 * PURPOSE:
 * Abstracts all server communication for the analysis view into a single hook.
 * The page component (AnalysisPage) stays thin and focused on UI logic —
 * it never calls the API directly, only consumes what this hook provides.
 *
 * WHAT IT FETCHES:
 * The full purchase request aggregate via GET /purchases/purchase-requests/{id}.
 * The response includes:
 *   - id, createdAt
 *   - employee { id, name, surname }
 *   - details  [ { product { id, code, description, category }, quantity } ]
 *   - quotes   [ { id, supplier, status, details [ { productId, confirmedQuantity,
 *                                                     unitCost, enabled } ] } ]
 *
 * The `quotes` array is what drives the analysis: each quote represents one
 * supplier's response, and each quote.detail line contains the price and
 * confirmed quantity for a product.
 *
 * MEMOIZATION:
 * `load` is wrapped in useCallback with [requestId] as its dependency.
 * This means the function reference only changes when requestId changes,
 * which is the correct trigger for a new fetch. The useEffect that calls
 * load() therefore also only re-runs when requestId changes.
 *
 * MANUAL REFETCH:
 * The hook exposes `refetch` (same reference as `load`) so the page can
 * trigger a fresh fetch after a mutation (e.g. after saving a quotation).
 *
 * @param {string|number} requestId - The purchase request ID from the route params.
 *
 * @returns {{
 *   data:    Object|null,   - Full purchase request aggregate, or null while loading.
 *   loading: boolean,       - True during the initial fetch and any manual refetch.
 *   error:   string|null,   - Human-readable error message, or null if no error.
 *   refetch: Function,      - Call this to manually re-fetch (e.g. after a save).
 * }}
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { getPurchaseRequestById } from "@/lib/http/client/purchase-request";

export function usePurchaseRequestAnalysis(requestId) {
  // The full purchase request aggregate returned by the backend
  const [data, setData] = useState(null);

  // Controls the loading spinner / skeleton in the consuming page
  const [loading, setLoading] = useState(false);

  // Holds a human-readable error string if the fetch fails; null otherwise
  const [error, setError] = useState(null);

  /**
   * Fetches the purchase request from the API.
   *
   * Wrapped in useCallback so that:
   * 1. The function reference is stable between renders (prevents infinite loops
   *    in useEffect dependency arrays).
   * 2. It only regenerates when requestId changes, which is the only meaningful
   *    trigger for fetching a different resource.
   *
   * Guards:
   * - Early return if requestId is falsy (page hasn't received its route param yet).
   *
   * Error handling:
   * - Any thrown error (network, 4xx, 5xx) is caught and stored as a string in
   *   `error` state. The page renders this message inline instead of crashing.
   */
  const load = useCallback(async () => {
    if (!requestId) return;

    setLoading(true);
    setError(null); // clear previous errors on each attempt

    try {
      const result = await getPurchaseRequestById(requestId);
      setData(result);
    } catch (err) {
      // Prefer the error's message property; fall back to a generic Spanish string
      setError(err.message || "Error al cargar la solicitud");
    } finally {
      // Always clear the loading state, whether the fetch succeeded or failed
      setLoading(false);
    }
  }, [requestId]);

  /**
   * Trigger the fetch whenever `load` changes (i.e. when requestId changes).
   * On initial mount this runs once and fetches the data for the current requestId.
   */
  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    refetch: load, // expose so the page can re-fetch after mutations
  };
}