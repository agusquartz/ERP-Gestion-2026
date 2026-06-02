"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OrderSearch } from "@/modules/purchases/purchase-requests/list/components/OrderSearch";
import { OrderTable } from "@/modules/purchases/purchase-requests/list/components/OrderTable";
import { listPurchaseRequests } from "@/lib/http/client/purchase-request";

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function mapPurchaseRequestToOrder(purchaseRequest) {
  return {
    id: purchaseRequest.id,
    request_number: `PED-${String(purchaseRequest.id).padStart(3, "0")}`,
    order_number: null,
    date: formatDate(purchaseRequest.createdAt),
    status: "Pendiente",
    provider: purchaseRequest.employee
      ? `${purchaseRequest.employee.name} ${purchaseRequest.employee.surname}`
      : "Sin empleado",
  };
}

export default function ListPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadPurchaseRequests(contains = "") {
    try {
      setLoading(true);
      setError("");
      const data = await listPurchaseRequests({ contains });
      const mappedOrders = data.map(mapPurchaseRequestToOrder);
      setOrders(mappedOrders);
    } catch (error) {
      console.error("Error cargando pedidos de compra:", error);
      setError(error.message || "No se pudieron cargar los pedidos de compra");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPurchaseRequests();
  }, []);

  const handleSearch = (filters) => {
    if (typeof filters === "string") {
      loadPurchaseRequests(filters);
      return;
    }
    loadPurchaseRequests(filters?.contains || "");
  };

  const handleView = (id) => {
    router.push(`/purchases/purchase-requests/${id}`);
  };

  return (
    <div className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-24px)] md:h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
          Pedidos de Compra
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de pedidos de compra..
       </p>
        
         <div className="mt-2 h-px w-full bg-border" />
      </div>

      <OrderSearch onSearch={handleSearch} />

      {loading && (
        <div className="py-4 text-sm text-muted-foreground">
          Cargando pedidos de compra...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <OrderTable
          orders={orders}
          onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
          onView={handleView}
        />
      )}

      <div className="mt-4 flex justify-between items-center px-2">
        <span className="text-sm text-muted-foreground">
          Total: {orders.length} pedidos
        </span>
      </div>
    </div>
  );
}