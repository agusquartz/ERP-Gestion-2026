// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// import { OrderSearch } from "@/modules/purchases/purchase-requests/list/components/OrderSearch";
// import { OrderTable } from "@/modules/purchases/purchase-requests/list/components/OrderTable";
// import { listPurchaseRequests } from "@/lib/http/client/purchase-request";

// function formatDate(dateString) {
//   if (!dateString) return "-";
//   const date = new Date(dateString);
//   return new Intl.DateTimeFormat("es-PY", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//   }).format(date);
// }

// function mapPurchaseRequestToOrder(purchaseRequest) {
//   return {
//     id: purchaseRequest.id,
//     request_number: `PED-${String(purchaseRequest.id).padStart(3, "0")}`,
//     order_number: null,
//     date: formatDate(purchaseRequest.createdAt),
//     status: "Pendiente",
//     provider: purchaseRequest.employee
//       ? `${purchaseRequest.employee.name} ${purchaseRequest.employee.surname}`
//       : "Sin empleado",
//   };
// }

// export default function ListPage() {
//   const router = useRouter();
//   const [selectedId, setSelectedId] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   async function loadPurchaseRequests(contains = "") {
//     try {
//       setLoading(true);
//       setError("");
//       const data = await listPurchaseRequests({ contains });

//       const mappedOrders = data.requests.map(mapPurchaseRequestToOrder);

//       setOrders(mappedOrders);
//     } catch (error) {
//       console.error("Error cargando pedidos de compra:", error);
//       setError(error.message || "No se pudieron cargar los pedidos de compra");
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     loadPurchaseRequests();
//   }, []);

//   const handleSearch = (filters) => {
//     if (typeof filters === "string") {
//       loadPurchaseRequests(filters);
//       return;
//     }
//     loadPurchaseRequests(filters?.contains || "");
//   };

//   const handleView = (id) => {
//     router.push(`/purchases/purchase-requests/${id}`);
//   };

//   return (
//     <div className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-24px)] md:h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:p-4 md:p-6">
//       <div className="mb-5">
//         <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
//           Pedidos de Compra
//         </h1>

//         <p className="mt-1 text-sm text-muted-foreground">
//           Gestión de pedidos de compra..
//        </p>
        
//          <div className="mt-2 h-px w-full bg-border" />
//       </div>

//       <OrderSearch onSearch={handleSearch} />

//       {loading && (
//         <div className="py-4 text-sm text-muted-foreground">
//           Cargando pedidos de compra...
//         </div>
//       )}

//       {error && (
//         <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       {!loading && !error && (
//         <OrderTable
//           orders={orders}
//           onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
//           onView={handleView}
//         />
//       )}

//       <div className="mt-4 flex justify-between items-center px-2">
//         <span className="text-sm text-muted-foreground">
//           Total: {orders.length} pedidos
//         </span>
//       </div>
//     </div>
//   );
// }


"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OrderSearch } from "@/modules/purchases/purchase-requests/list/components/OrderSearch";
import { OrderTable } from "@/modules/purchases/purchase-requests/list/components/OrderTable";
import { listPurchaseRequests } from "@/lib/http/client/purchase-request";

const PAGE_SIZE = 10;

const INITIAL_FILTERS = {
  search: "",
  filter: "",
  status: "",
  since: "",
  to: "",
};

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);

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

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadPurchaseRequests() {
      try {
        setLoading(true);
        setError("");

        const data = await listPurchaseRequests({
          search: filters.search,
          filter: filters.filter,
          status: filters.status,
          since: filters.since,
          to: filters.to,
          cursor,
          limit: PAGE_SIZE,
        });

        const rows = Array.isArray(data?.requests) ? data.requests : [];
        const mappedOrders = rows.map(mapPurchaseRequestToOrder);

        if (!ignore) {
          setOrders(mappedOrders);
          setHasMore(Boolean(data?.hasMore ?? data?.has_more ?? false));
        }
      } catch (error) {
        console.error("Error cargando pedidos de compra:", error);

        if (!ignore) {
          setError(error.message || "No se pudieron cargar los pedidos de compra");
          setOrders([]);
          setHasMore(false);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadPurchaseRequests();

    return () => {
      ignore = true;
    };
  }, [filters, cursor]);

  const handleSearch = useCallback((nextFilters) => {
    const normalizedFilters =
      typeof nextFilters === "string"
        ? {
            ...INITIAL_FILTERS,
            search: nextFilters,
          }
        : {
            search: nextFilters?.search ?? nextFilters?.contains ?? "",
            filter: nextFilters?.filter ?? "",
            status: nextFilters?.status ?? "",
            since: nextFilters?.since ?? "",
            to: nextFilters?.to ?? "",
          };

    setFilters((prev) => {
      const isSame =
        prev.search === normalizedFilters.search &&
        prev.filter === normalizedFilters.filter &&
        prev.status === normalizedFilters.status &&
        prev.since === normalizedFilters.since &&
        prev.to === normalizedFilters.to;

      if (isSame) return prev;

      setCursor(null);
      setCursorStack([]);
      setHasMore(false);
      setSelectedId(null);

      return normalizedFilters;
    });
  }, []);

  const handleNextPage = () => {
    if (!orders.length || !hasMore) return;

    const lastOrder = orders[orders.length - 1];

    setCursorStack((prev) => [...prev, cursor]);
    setCursor(lastOrder.id);
    setSelectedId(null);
  };

  const handlePreviousPage = () => {
    if (!cursorStack.length) return;

    const previousCursor = cursorStack[cursorStack.length - 1];

    setCursorStack((prev) => prev.slice(0, -1));
    setCursor(previousCursor);
    setSelectedId(null);
  };

  const handleView = (id) => {
    router.push(`/purchases/purchase-requests/${id}`);
  };

  return (
    <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
      <div className="mb-5">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
          Pedidos de Compra
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de pedidos de compra.
        </p>

        <div className="mt-2 h-px w-full bg-border" />
      </div>

      <OrderSearch onSearch={handleSearch} />

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <OrderTable
        orders={orders}
        isLoading={loading}
        onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
        onView={handleView}
      />

      <div className="mt-4 flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          Mostrando {orders.length} pedidos
        </span>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handlePreviousPage}
            disabled={!cursorStack.length || loading}
            className="rounded-[5px] border border-border px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={!hasMore || loading}
            className="rounded-[5px] border border-border px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}