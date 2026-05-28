"use client";

import { useEffect, useState } from "react";

import { OrderSearch } from "@/modules/purchases/purchase-requests/list/components/OrderSearch";
import { OrderTable } from "@/modules/purchases/purchase-requests/list/components/OrderTable";

import { listPurchaseRequests } from "@/lib/http/client/purchase-request";
import { useRouter } from 'next/navigation';

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
    console.log("Filtros aplicados:", filters);

    if (typeof filters === "string") {
      loadPurchaseRequests(filters);
      return;
    }

    loadPurchaseRequests(filters?.contains || "");
  };

	const router = useRouter();
	const handleView = async (id) => {
		const order = orders.find((o) => o.id === id);
		if (!order) return;

		router.push(`/purchases/purchase-requests/${id}`);

		console.log("Visualizando pedido:", order.request_number);
	};

	return (
		<div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
		<div className="mb-5">
		<h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[42px]">
		Pedidos de Compra
		</h1>

		<div className="mt-2 h-px w-full bg-foreground/80" />
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
