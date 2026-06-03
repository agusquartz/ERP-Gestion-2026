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
  if (value === "ok" || value === "paid" || value === "pagado") return "Pagado";
  if (value === "pending" || value === "pendiente" || value === "created") return "Pendiente";
  if (value === "partial" || value === "parcial") return "Parcial";
  if (value === "cancelled" || value === "canceled" || value === "anulado") return "Anulado";
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

function statusBadgeClasses(statusName) {
  const normalized = normalizeStatus(statusName);
  switch (normalized) {
    case "Pagado":
      return {
        border: "border-success",
        bg: "bg-success/10",
        text: "text-success",
        dot: "bg-success",
      };
    case "Pendiente":
      return {
        border: "border-destructive",
        bg: "bg-destructive/10",
        text: "text-destructive",
        dot: "bg-destructive",
      };
    case "Parcial":
      return {
        border: "border-warning",
        bg: "bg-warning/10",
        text: "text-warning",
        dot: "bg-warning",
      };
    case "Anulado":
      return {
        border: "border-muted",
        bg: "bg-muted/10",
        text: "text-muted-foreground",
        dot: "bg-muted-foreground",
      };
    default:
      return {
        border: "border-muted",
        bg: "bg-muted/10",
        text: "text-muted-foreground",
        dot: "bg-muted-foreground",
      };
  }
}

function PaymentStatusBadge({ status }) {
  const { border, bg, text, dot } = statusBadgeClasses(status);
  return (
    <span
      className={`inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-bold ${border} ${bg} ${text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
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

const inputBaseClass =
  "w-full rounded-[5px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all duration-200 " +
  "placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15";

const dropdownButtonClass =
  "flex h-10 w-full items-center justify-between rounded-[5px] border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-background";

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
        if (!ignore) setOrders(mapped);
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || "No se pudieron cargar las órdenes de pago.");
        }
      } finally {
        if (!ignore) setIsLoading(false);
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
      if (activeTab !== PAYMENT_TABS.ALL && statusToTab(order.status) !== activeTab) return false;
      if (statusFilter && normalizeStatus(order.status) !== statusFilter) return false;

      if (secondaryFilter) {
        const q = secondaryFilter.toLowerCase();
        const matches =
          order.paymentNumber.toLowerCase().includes(q) ||
          order.supplier.toLowerCase().includes(q) ||
          order.status.toLowerCase().includes(q) ||
          String(order.total).includes(q);

        if (!matches) return false;
      }

      if (dateFilter && order.date !== dateFilter) return false;

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

  const handleSelect = (id) => setSelectedId(id === selectedId ? null : id);

  const handleOpen = (id) => router.push(`/purchases/purchase-payment-orders/${id}`);

  const tabs = [
    PAYMENT_TABS.ALL,
    PAYMENT_TABS.PAID,
    PAYMENT_TABS.PENDING,
    PAYMENT_TABS.PARTIAL,
    PAYMENT_TABS.CANCELLED,
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
      {/* Title */}
      <div className="mb-5">
        <h1 className="ttext-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
          Ordenes de Pago
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Pagos realizados a proveedores
        </p>

        <div className="mt-2 h-px w-full bg-border" />
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-[5px] border border-border bg-surface p-4 shadow-panel">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold text-secondary">
              Búsqueda
            </label>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Nro Pago, Proveedor..."
              className={inputBaseClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-secondary">
              Filtrar resultados
            </label>

            <input
              value={secondaryFilter}
              onChange={(e) => setSecondaryFilter(e.target.value)}
              placeholder="Filtrar por Nro, Proveedor, Método..."
              className={inputBaseClass}
            />
          </div>

          <div className="relative">
            <label className="mb-1 block text-xs font-semibold text-secondary invisible">
              -
            </label>

            <button
              type="button"
              onClick={() => {
                setShowDateDrop((prev) => !prev);
                setShowStatusDrop(false);
              }}
              className={dropdownButtonClass}
            >
              {dateFilter ? dateFilter : "Fecha"}
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {showDateDrop && (
              <div className="absolute z-20 mt-2 w-[180px] rounded-[5px] border border-border bg-surface p-2 shadow-panel">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setShowDateDrop(false);
                  }}
                  className="w-full rounded-[5px] border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />

                <button
                  type="button"
                  onClick={() => {
                    setDateFilter("");
                    setShowDateDrop(false);
                  }}
                  className="mt-2 w-full rounded-[5px] px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-background"
                >
                  Todas las fechas
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-secondary invisible">
              -
            </label>

            <button
              type="button"
              onClick={clearFilters}
              className="h-10 w-full rounded-[5px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-background"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 rounded-[5px] border border-border bg-surface p-2 shadow-panel">
        <div className="flex flex-wrap gap-2">
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
                className={`flex items-center gap-2 rounded-[5px] px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-background"
                }`}
              >
                {tab}

                {showCount && counts[tab] > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
                    {counts[tab]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="mb-4 rounded-[5px] border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Cargando órdenes de pago...
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[900px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[70px]" />
              <col className="w-[170px]" />
              <col className="w-[150px]" />
              <col />
              <col className="w-[170px]" />
              <col className="w-[150px]" />
              <col className="w-[140px]" />
            </colgroup>

            <thead>
              <tr className="bg-background">
                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  #
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Número de Pago
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fecha
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Proveedor
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Monto Total
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order, index) => {
                const isSelected = selectedId === order.id;

                return (
                  <tr
                    key={order.id}
                    onClick={() => handleSelect(order.id)}
                    className={`group cursor-pointer border-b border-gray-100 transition-colors ${
                      isSelected ? "bg-[#f0f7ff]" : "hover:bg-[#f0f7ff]"
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center text-sm text-foreground">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3.5 text-sm font-bold text-[#2b6df5]">
                      {order.paymentNumber}
                    </td>

                    <td className="px-4 py-3.5 text-sm text-foreground">
                      {formatDate(order.date)}
                    </td>

                    <td
                      className="truncate px-4 py-3.5 text-sm font-medium text-foreground"
                      title={order.supplier}
                    >
                      {order.supplier}
                    </td>

                    <td className="px-4 py-3.5 text-right text-sm font-bold text-foreground">
                      {formatMoney(order.total)}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center">
                        <PaymentStatusBadge status={order.status} />
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end">
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpen(order.id);
                            }}
                            className="rounded-[5px] bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover active:translate-y-px"
                          >
                            Seleccionar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-9 text-center text-sm text-muted-foreground"
                  >
                    No hay órdenes de pago disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CAMBIO: contador dentro del marco de la tabla, igual al estilo DocumentsTable */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            Mostrando {filteredOrders.length} de {orders.length} resultados
          </span>
        </div>
      </div>
    </div>
  );
}