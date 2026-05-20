// modules/purchases/purchase-requests/analysis/pages/AnalysisPage.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePurchaseRequestAnalysis } from "../hooks/usePurchaseRequestAnalysis";
import { AnalysisTable } from "../components/AnalysisTable";
import { SelectSupplierModal } from "../components/SelectSupplierModal";
import { createPurchaseOrder } from "@/lib/http/client/purchase-orders";
import { InfoIcon } from "@/shared/components/Icons";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Devuelve el supplierId con el menor unitCost para un producto dado.
 * unitCost viene como string del backend → parseFloat para comparar correctamente.
 */
function getCheapestSupplierId(productId, quotes) {
  if (!quotes?.length) return null;
  let best = null;
  for (const quote of quotes) {
    const detail = quote.details?.find((d) => d.productId === productId);
    if (!detail || detail.unitCost == null || !quote.supplier?.id) continue;
    const cost = parseFloat(detail.unitCost);
    if (best === null || cost < best.cost) {
      best = { supplierId: quote.supplier.id, cost };
    }
  }
  return best?.supplierId ?? null;
}

/**
 * Inicializa selectedSuppliers: productId -> supplierId más barato.
 * Solo para productos que tienen al menos una cotización con unitCost.
 */
function buildInitialSelection(details, quotes) {
  const map = {};
  for (const detail of details) {
    const id = getCheapestSupplierId(detail.product.id, quotes);
    if (id) map[detail.product.id] = id;
  }
  return map;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalysisPage({ requestId }) {
  const router = useRouter();
  const { data, loading, error } = usePurchaseRequestAnalysis(requestId);

  const [selectedSuppliers, setSelectedSuppliers] = useState({});
  const [modalProduct, setModalProduct] = useState(null); // { product, requestedQty }
  const [saving, setSaving] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  // ── Auto-seleccionar el proveedor más barato cuando llegan los datos ─────
  useEffect(() => {
    if (!data?.details?.length) return;
    const initial = buildInitialSelection(data.details, data.quotes ?? []);
    setSelectedSuppliers(initial);
  }, [data]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleOpenModal = useCallback((product, requestedQty) => {
    setModalProduct({ product, requestedQty });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalProduct(null);
  }, []);

  const handleSupplierSelected = useCallback((productId, supplierId) => {
    setSelectedSuppliers((prev) => ({ ...prev, [productId]: supplierId }));
    setModalProduct(null);
  }, []);

  const handleGenerate = async () => {
    if (!data) return;

    // Agrupar por supplierId
    const groups = {};
    for (const detail of data.details) {
      const productId = detail.product.id;
      const supplierId = selectedSuppliers[productId];
      if (!supplierId) continue;
      if (!groups[supplierId]) groups[supplierId] = [];
      groups[supplierId].push({ productId, orderedQuantity: detail.quantity });
    }

    if (Object.keys(groups).length === 0) {
      setGenerateError("Debés seleccionar el proveedor para al menos un producto.");
      return;
    }

    setSaving(true);
    setGenerateError(null);
    const today = new Date().toISOString().split("T")[0];

    try {
      await Promise.all(
        Object.entries(groups).map(([supplierId, details]) =>
          createPurchaseOrder({
            purchaseRequestId: data.id,
            createdAt: today,
            supplierId: parseInt(supplierId, 10),
            details,
          })
        )
      );
      router.push("/purchases/purchase-orders");
    } catch (err) {
      setGenerateError(err.message || "Error al crear las órdenes.");
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const assignedCount = Object.keys(selectedSuppliers).length;
  const totalCount = data?.details?.length ?? 0;
  const allAssigned = totalCount > 0 && assignedCount === totalCount;

  // ── Render ────────────────────────────────────────────────────────────────

  if (!requestId) {
    return <div className="p-6 text-sm text-red-500">ID de solicitud no proporcionado.</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6">

      {/* ── Header ── */}
      <div className="mb-4 shrink-0">
        <h1 className="text-[30px] font-extrabold leading-none tracking-tight text-foreground md:text-[30px]">
          Análisis{" "}
          {data && (
            <span className="text-foreground">
              #PC-{String(data.id).padStart(2, "0")}
            </span>
          )}
        </h1>

        <div className="mt-4 h-px w-full bg-border" />

        {data && (
          <p className="text-[15px] text-foreground mt-2 border border-border rounded-[5px] pl-4 pt-1 pb-1">
            Solicitante:{" "}
            <span className="font-medium">
              {data.employee?.name} {data.employee?.surname}
            </span>
          </p>
        )}
        
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div className="py-4 text-sm text-muted">Cargando solicitud...</div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Content ── */}
      {!loading && !error && data && (
        <>
          {/* Info banner si faltan proveedores */}
          {!allAssigned && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-700">
              <span className="shrink-0 mt-0.5">
                <InfoIcon />
              </span>
              <span>
                Debés seleccionar el proveedor para al menos un producto.
              </span>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <p className="block text-gray-700 text-ls font-semibold mb-2 tracking-wide ">
              Ítems de la cotización — Selección de proveedores
            </p>
            <AnalysisTable
              details={data.details}
              quotes={data.quotes ?? []}
              selectedSuppliers={selectedSuppliers}
              onSelectSupplier={handleOpenModal}
            />
          </div>

          {/* Contador */}
          <p className="mt-2 text-right text-xs text-muted shrink-0">
            Proveedores: {String(assignedCount).padStart(2, "0")}
          </p>

          {/* Error al generar */}
          {generateError && (
            <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 shrink-0">
              {generateError}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex justify-end gap-3 shrink-0">
            <button
              onClick={() => router.back()}
              className="px-5 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-[#F2F3F7] transition-colors shadow-panel"
            >
              Atrás
            </button>
            <button
              onClick={handleGenerate}
              disabled={saving || assignedCount === 0}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors shadow-panel disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Generando..." : "Generar"}
            </button>
          </div>
        </>
      )}

      {/* ── Modal ── */}
      {modalProduct && data && (
        <SelectSupplierModal
          product={modalProduct.product}
          requestedQty={modalProduct.requestedQty}
          quotes={data.quotes ?? []}
          currentSupplierId={selectedSuppliers[modalProduct.product.id]}
          onSelect={(supplierId) =>
            handleSupplierSelected(modalProduct.product.id, supplierId)
          }
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}