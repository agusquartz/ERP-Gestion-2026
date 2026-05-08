"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPurchasePaymentOrders } from "@/lib/http/client/purchase-payment-order";

const PAYMENT_TABS = {
  ALL: "Todos",
  PAID: "Pagos",
  PENDING: "Pendientes",
  PARTIAL: "Parciales",
  CANCELLED: "Anulados",
};

function formatMoney(value) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(dateString) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function normalizeStatus(statusName) {
  const value = String(statusName || "").toLowerCase();

  if (value === "ok" || value === "paid" || value === "pagado") {
    return "Pagado";
  }

  if (value === "pending" || value === "pendiente" || value === "created") {
    return "Pendiente";
  }

  if (value === "partial" || value === "parcial") {
    return "Parcial";
  }

  if (value === "cancelled" || value === "canceled" || value === "anulado") {
    return "Anulado";
  }

  return statusName || "Pendiente";
}

function statusToTab(statusName) {
  const normalized = normalizeStatus(statusName);

  if (normalized === "Pagado") return PAYMENT_TABS.PAID;
  if (normalized === "Pendiente") return PAYMENT_TABS.PENDING;
  if (normalized === "Parcial") return PAYMENT_TABS.PARTIAL;
  if (normalized === "Anulado") return PAYMENT_TABS.CANCELLED;

  return PAYMENT_TABS.ALL;
}

function statusBadgeClass(statusName) {
  const normalized = normalizeStatus(statusName);

  if (normalized === "Pagado") {
    return "border-[#6b4dff] bg-[#f1eeff] text-[#3100c9]";
  }

  if (normalized === "Pendiente") {
    return "border-red-500 bg-red-50 text-red-900";
  }

  if (normalized === "Parcial") {
    return "border-yellow-300 bg-yellow-50 text-yellow-800";
  }

  if (normalized === "Anulado") {
    return "border-slate-400 bg-slate-100 text-slate-700";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function statusDotClass(statusName) {
  const normalized = normalizeStatus(statusName);

  if (normalized === "Pagado") return "bg-[#3100c9]";
  if (normalized === "Pendiente") return "bg-red-900";
  if (normalized === "Parcial") return "bg-yellow-700";
  if (normalized === "Anulado") return "bg-slate-600";

  return "bg-slate-500";
}

function ChevronDownIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function paymentOrderToRow(order) {
  return {
    id: order.id,
    paymentNumber: String(order.id).padStart(4, "0"),
    date: order.createdAt,
    supplier: order.supplier?.name || "Sin proveedor",
    total: Number(order.totalToPay || 0),
    status: normalizeStatus(order.status?.name),
    raw: order,
  };
}

function PaymentStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex min-w-[96px] items-center gap-2 rounded-[4px] border px-3 py-0.5 text-[11px] font-bold ${statusBadgeClass(
        status
      )}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(status)}`} />
      {status}
    </span>
  );
}

export default function PurchasePaymentOrdersPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(PAYMENT_TABS.ALL);
  const [search, setSearch] = useState("");
  const [secondaryFilter, setSecondaryFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showDateDrop, setShowDateDrop] = useState(false);
  const [showStatusDrop, setShowStatusDrop] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadPaymentOrders() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const data = await getPurchasePaymentOrders(search);
        const mapped = data.map(paymentOrderToRow);

        if (!ignore) {
          setOrders(mapped);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || "No se pudieron cargar las órdenes de pago.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    const timeoutId = setTimeout(loadPaymentOrders, 300);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [search]);

  const counts = useMemo(() => {
    return {
      [PAYMENT_TABS.ALL]: orders.length,
      [PAYMENT_TABS.PAID]: orders.filter((o) => statusToTab(o.status) === PAYMENT_TABS.PAID).length,
      [PAYMENT_TABS.PENDING]: orders.filter((o) => statusToTab(o.status) === PAYMENT_TABS.PENDING).length,
      [PAYMENT_TABS.PARTIAL]: orders.filter((o) => statusToTab(o.status) === PAYMENT_TABS.PARTIAL).length,
      [PAYMENT_TABS.CANCELLED]: orders.filter((o) => statusToTab(o.status) === PAYMENT_TABS.CANCELLED).length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab !== PAYMENT_TABS.ALL && statusToTab(order.status) !== activeTab) {
        return false;
      }

      if (statusFilter && normalizeStatus(order.status) !== statusFilter) {
        return false;
      }

      if (secondaryFilter) {
        const query = secondaryFilter.toLowerCase();

        const matches =
          order.paymentNumber.toLowerCase().includes(query) ||
          order.supplier.toLowerCase().includes(query) ||
          order.status.toLowerCase().includes(query) ||
          String(order.total).includes(query);

        if (!matches) return false;
      }

      if (dateFilter && order.date !== dateFilter) {
        return false;
      }

      return true;
    });
  }, [orders, activeTab, secondaryFilter, statusFilter, dateFilter]);

  const clearFilters = () => {
    setSearch("");
    setSecondaryFilter("");
    setDateFilter("");
    setStatusFilter("");
    setShowDateDrop(false);
    setShowStatusDrop(false);
    setActiveTab(PAYMENT_TABS.ALL);
    setSelectedId(null);
  };

  const handleSelect = (id) => {
    setSelectedId(id === selectedId ? null : id);
  };

  const handleOpen = (id) => {
    router.push(`/purchase-payment-orders/${id}`);
  };

  const tabs = [
    PAYMENT_TABS.ALL,
    PAYMENT_TABS.PAID,
    PAYMENT_TABS.PENDING,
    PAYMENT_TABS.PARTIAL,
    PAYMENT_TABS.CANCELLED,
  ];

  return (
    <div className="flex h-full min-h-screen flex-col bg-white px-2 py-4 text-[#111327]">
      <div className="mb-2">
        <h1 className="text-[30px] font-extrabold leading-none tracking-tight">
          Ordenes de Pago
        </h1>
        <p className="mt-2 text-[13px] font-medium text-black">
          Pagos realizados a proveedores
        </p>
        <div className="mt-2 h-px w-full bg-slate-400" />
      </div>

      <section className="mb-6 rounded-[4px] border border-slate-200 bg-white px-2 py-2">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_105px_95px_115px] lg:items-end">
          <div>
            <label className="mb-1 block text-[10px] font-extrabold text-black">
              Busqueda
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por Nro Pago, Proveedor..."
              className="h-[29px] w-full rounded-[4px] border border-slate-300 px-3 text-[11px] font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#5200ff] focus:ring-2 focus:ring-[#5200ff]/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-extrabold text-black">
              Filtrar resultados
            </label>
            <input
              value={secondaryFilter}
              onChange={(event) => setSecondaryFilter(event.target.value)}
              placeholder="Filtrar por estado Nro, Proveedor,Metodo"
              className="h-[29px] w-full rounded-[4px] border border-slate-300 px-3 text-[11px] font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#5200ff] focus:ring-2 focus:ring-[#5200ff]/10"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowDateDrop((prev) => !prev);
                setShowStatusDrop(false);
              }}
              className="flex h-[32px] w-full items-center justify-between rounded-[4px] bg-[#f7f7f8] px-4 text-[12px] font-extrabold text-black shadow-[0_2px_5px_rgba(0,0,0,0.2)]"
            >
              Fecha
              <ChevronDownIcon className="h-5 w-5" />
            </button>

            {showDateDrop && (
              <div className="absolute z-20 mt-2 w-[180px] rounded-md border border-slate-200 bg-white p-2 shadow-xl">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => {
                    setDateFilter(event.target.value);
                    setShowDateDrop(false);
                  }}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#5200ff]"
                />

                <button
                  type="button"
                  onClick={() => {
                    setDateFilter("");
                    setShowDateDrop(false);
                  }}
                  className="mt-2 w-full rounded px-2 py-1 text-left text-sm font-semibold hover:bg-slate-50"
                >
                  Todas las fechas
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowStatusDrop((prev) => !prev);
                setShowDateDrop(false);
              }}
              className="flex h-[32px] w-full items-center justify-between rounded-[4px] bg-[#f7f7f8] px-4 text-[12px] font-extrabold text-black shadow-[0_2px_5px_rgba(0,0,0,0.2)]"
            >
              Estado
              <ChevronDownIcon className="h-5 w-5" />
            </button>

            {showStatusDrop && (
              <div className="absolute z-20 mt-2 w-[150px] rounded-md border border-slate-200 bg-white p-1.5 shadow-xl">
                {["", "Pagado", "Pendiente", "Parcial", "Anulado"].map((status) => (
                  <button
                    key={status || "all"}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setShowStatusDrop(false);
                    }}
                    className="w-full rounded px-3 py-2 text-left text-[13px] font-semibold text-slate-700 hover:bg-[#f0f7ff] hover:text-[#5200ff]"
                  >
                    {status || "Todos"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="h-[32px] rounded-[4px] border border-slate-300 bg-white px-4 text-[12px] font-extrabold text-black transition hover:bg-slate-50"
          >
            Limpiar Filtros
          </button>
        </div>
      </section>

      <section className="mb-5 rounded-[4px] border border-slate-200 bg-white px-6 py-1.5 shadow-[0_2px_5px_rgba(0,0,0,0.22)]">
        <div className="grid grid-cols-5 gap-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const showCount =
              tab === PAYMENT_TABS.PENDING ||
              tab === PAYMENT_TABS.PARTIAL ||
              tab === PAYMENT_TABS.CANCELLED;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedId(null);
                }}
                className={`flex h-[29px] items-center justify-center gap-2 rounded-[5px] text-[13px] font-extrabold transition ${
                  isActive
                    ? "bg-[#eef4ff] text-[#5200ff] shadow-[0_2px_5px_rgba(0,0,0,0.16)]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab}

                {showCount && counts[tab] > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-extrabold text-slate-600">
                    {counts[tab]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {isLoading && (
        <p className="mb-2 text-sm font-semibold text-slate-500">
          Cargando órdenes de pago...
        </p>
      )}

      {errorMessage && (
        <p className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      )}

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-slate-200 bg-white">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="h-[25px] bg-[#ededf1] text-[11px] font-extrabold text-black shadow-[0_2px_5px_rgba(0,0,0,0.25)]">
                <th className="w-[60px] px-3 text-center">#</th>
                <th className="px-3 text-left">Numero de Pago</th>
                <th className="px-3 text-left">Fecha</th>
                <th className="px-3 text-left">Proveedor</th>
                <th className="px-3 text-left">Monto Total</th>
                <th className="px-3 text-center">Estado</th>
                <th className="w-[150px] px-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order, index) => {
                const isSelected = selectedId === order.id;

                return (
                  <tr
                    key={order.id}
                    onClick={() => handleSelect(order.id)}
                    className={`h-[28px] cursor-pointer text-[11px] text-black transition ${
                      isSelected
                        ? "bg-[#ece7ff]"
                        : index % 2 === 1
                          ? "bg-[#f0f0f4]"
                          : "bg-white"
                    } hover:bg-[#f0f7ff]`}
                  >
                    <td className="px-3 text-center">{index + 1}</td>

                    <td className="px-3 font-medium">{order.paymentNumber}</td>

                    <td className="px-3">{formatDate(order.date)}</td>

                    <td className="truncate px-3" title={order.supplier}>
                      {order.supplier}
                    </td>

                    <td className="px-3">{formatMoney(order.total)}</td>

                    <td className="px-3 text-center">
                      <PaymentStatusBadge status={order.status} />
                    </td>

                    <td className="px-3 text-center">
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpen(order.id);
                          }}
                          className="rounded-[5px] bg-[#5200ff] px-3 py-1.5 text-[10px] font-extrabold text-white shadow-md transition hover:bg-[#4300d6]"
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm font-semibold text-slate-400"
                  >
                    No hay órdenes de pago disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-3 pl-2 text-[12px] font-bold text-slate-400">
        Mostrando {filteredOrders.length} de {orders.length} resultados
      </p>
    </div>
  );
}