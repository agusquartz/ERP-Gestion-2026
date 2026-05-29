"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getReturnNotes } from "@/lib/http/client/return-notes";

const INITIAL_CURSOR = 0;

const RETURN_NOTE_STATUS_OPTIONS = [
  {
    value: "all",
    label: "Todo",
    statusId: null,
  },
  {
    value: "pending",
    label: "Pendiente",
    statusId: 1,
  },
  {
    value: "approved",
    label: "Aprobado",
    statusId: 2,
  },
  {
    value: "cancelled",
    label: "Cancelado",
    statusId: 3,
  },
];

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

  if (value === "pending" || value === "pendiente" || value === "created") {
    return "Pending";
  }

  if (value === "approved" || value === "aprobado" || value === "ok") {
    return "Approved";
  }

  if (value === "cancelled" || value === "canceled" || value === "anulado") {
    return "Cancelled";
  }

  return statusName || "Pending";
}

function statusBadgeClasses(statusName) {
  const normalized = normalizeStatus(statusName);

  switch (normalized) {
    case "Approved":
      return {
        border: "border-success",
        bg: "bg-success/10",
        text: "text-success",
        dot: "bg-success",
      };

    case "Pending":
      return {
        border: "border-warning",
        bg: "bg-warning/10",
        text: "text-warning",
        dot: "bg-warning",
      };

    case "Cancelled":
      return {
        border: "border-destructive",
        bg: "bg-destructive/10",
        text: "text-destructive",
        dot: "bg-destructive",
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

function ReturnNoteStatusBadge({ status }) {
  const { border, bg, text, dot } = statusBadgeClasses(status);

  return (
    <span
      className={`inline-flex min-w-[96px] items-center gap-2 rounded-[5px] border px-2.5 py-0.5 text-xs font-semibold ${border} ${bg} ${text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {normalizeStatus(status)}
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

function returnNoteToRow(note) {
  return {
    id: note.id,
    returnNoteNumber: String(note.id).padStart(4, "0"),
    purchaseInvoiceId: note.purchaseInvoiceId,
    motive: note.motive || "-",
    date: note.createdAt,
    supplier: note.supplier?.name || "No supplier",
    total: Number(note.total || 0),
    status: normalizeStatus(note.status?.name),
    raw: note,
  };
}

const inputBaseClass =
  "w-full rounded-[5px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all duration-200 " +
  "placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15";

const dropdownButtonClass =
  "flex h-10 w-full items-center justify-between rounded-[5px] border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-background";

export default function ReturnNotesPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [secondaryFilter, setSecondaryFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("pending");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [cursor, setCursor] = useState(INITIAL_CURSOR);

  const [showDateDrop, setShowDateDrop] = useState(false);
  const [showStatusDrop, setShowStatusDrop] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [returnNotes, setReturnNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const selectedStatus = useMemo(() => {
    return (
      RETURN_NOTE_STATUS_OPTIONS.find((option) => option.value === statusFilter) ??
      RETURN_NOTE_STATUS_OPTIONS[1]
    );
  }, [statusFilter]);

  useEffect(() => {
    let ignore = false;

    async function loadReturnNotes() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const data = await getReturnNotes({
          contains: search,
          statusId: selectedStatus.statusId,
          fromDate: fromDateFilter,
          toDate: toDateFilter,
          cursor,
        });

        const mapped = data.map(returnNoteToRow);

        if (!ignore) {
          setReturnNotes(mapped);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || "Return notes could not be loaded.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    const timeoutId = setTimeout(loadReturnNotes, 300);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [search, selectedStatus.statusId, fromDateFilter, toDateFilter, cursor]);

  const filteredReturnNotes = useMemo(() => {
    return returnNotes.filter((note) => {
      if (secondaryFilter) {
        const query = secondaryFilter.toLowerCase();

        const matches =
          note.returnNoteNumber.toLowerCase().includes(query) ||
          String(note.purchaseInvoiceId).includes(query) ||
          note.supplier.toLowerCase().includes(query) ||
          note.motive.toLowerCase().includes(query) ||
          note.status.toLowerCase().includes(query) ||
          String(note.total).includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [returnNotes, secondaryFilter]);

  const clearFilters = () => {
    setSearch("");
    setSecondaryFilter("");
    setStatusFilter("pending");
    setFromDateFilter("");
    setToDateFilter("");
    setCursor(INITIAL_CURSOR);
    setShowDateDrop(false);
    setShowStatusDrop(false);
    setSelectedId(null);
  };

  const handleSelect = (id) => {
    setSelectedId(id === selectedId ? null : id);
  };

  const handleOpen = (id) => {
    router.push(`/purchases/return-notes/${id}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
      {/* Title */}
      <div className="mb-5">
        <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[42px]">
          Nota de Devolucion
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
         Devoluciones de productos registradas a partir de facturas de compra
        </p>
        <div className="mt-2 h-px w-full bg-foreground/80" />
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-[5px] border border-border bg-surface p-4 shadow-panel">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold text-secondary">
              Busqueda
            </label>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCursor(INITIAL_CURSOR);
              }}
              placeholder="buscar por nota de devolucion, factura, proveedor..."
              className={inputBaseClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-secondary">
              Filtrar resultados
            </label>
            <input
              value={secondaryFilter}
              onChange={(event) => setSecondaryFilter(event.target.value)}
              placeholder="Filtrar por nota,invoice..."
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
              {fromDateFilter || toDateFilter ? "Date range" : "Date"}
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {showDateDrop && (
              <div className="absolute z-20 mt-2 w-[240px] rounded-[5px] border border-border bg-surface p-2 shadow-panel">
                <label className="mb-1 block text-xs font-semibold text-secondary">
                  Desde
                </label>
                <input
                  type="date"
                  value={fromDateFilter}
                  onChange={(event) => {
                    setFromDateFilter(event.target.value);
                    setCursor(INITIAL_CURSOR);
                  }}
                  className="w-full rounded-[5px] border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />

                <label className="mb-1 mt-3 block text-xs font-semibold text-secondary">
                  Hasta
                </label>
                <input
                  type="date"
                  value={toDateFilter}
                  onChange={(event) => {
                    setToDateFilter(event.target.value);
                    setCursor(INITIAL_CURSOR);
                  }}
                  className="w-full rounded-[5px] border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />

                <button
                  type="button"
                  onClick={() => {
                    setFromDateFilter("");
                    setToDateFilter("");
                    setCursor(INITIAL_CURSOR);
                    setShowDateDrop(false);
                  }}
                  className="mt-2 w-full rounded-[5px] px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-background"
                >
                  Todo
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <label className="mb-1 block text-xs font-semibold text-secondary invisible">
              -
            </label>
            <button
              type="button"
              onClick={() => {
                setShowStatusDrop((prev) => !prev);
                setShowDateDrop(false);
              }}
              className={dropdownButtonClass}
            >
              {selectedStatus.label}
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {showStatusDrop && (
              <div className="absolute z-20 mt-2 w-[180px] rounded-[5px] border border-border bg-surface p-2 shadow-panel">
                {RETURN_NOTE_STATUS_OPTIONS.map((option) => {
                  const isActive = option.value === statusFilter;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(option.value);
                        setCursor(INITIAL_CURSOR);
                        setShowStatusDrop(false);
                        setSelectedId(null);
                      }}
                      className={`w-full rounded-[5px] px-3 py-2 text-left text-sm font-medium transition ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-background"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
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
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="mb-4 rounded-[5px] border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Loading return notes...
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
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 bg-background text-xs font-semibold text-muted-foreground">
                <th className="w-[60px] border-b border-border px-3 py-2.5 text-center">
                  #
                </th>
                <th className="border-b border-border px-3 py-2.5 text-left">
                  Factura 
                </th>
                <th className="border-b border-border px-3 py-2.5 text-left">
                  Nota Devolucion Nro
                </th>
                <th className="border-b border-border px-3 py-2.5 text-left">
                  Fecha
                </th>
                <th className="border-b border-border px-3 py-2.5 text-left">
                  Proveedor
                </th>
                <th className="border-b border-border px-3 py-2.5 text-left">
                  Total$
                </th>
                <th className="border-b border-border px-3 py-2.5 text-center">
                  Estado
                </th>
                <th className="w-[150px] border-b border-border px-3 py-2.5 text-center">
                  Accion
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredReturnNotes.map((note, index) => {
                const isSelected = selectedId === note.id;

                return (
                  <tr
                    key={note.id}
                    onClick={() => handleSelect(note.id)}
                    className={`cursor-pointer border-b border-border text-sm text-foreground transition-colors duration-150 ${
                      isSelected ? "bg-primary/10" : "bg-surface hover:bg-background"
                    }`}
                  >
                    <td className="px-3 py-2.5 text-center">{index + 1}</td>

                    <td className="px-3 py-2.5 font-medium">
                      {note.returnNoteNumber}
                    </td>

                    <td className="px-3 py-2.5">
                      {note.purchaseInvoiceId}
                    </td>

                    <td className="px-3 py-2.5">
                      {formatDate(note.date)}
                    </td>

                    <td className="truncate px-3 py-2.5" title={note.supplier}>
                      {note.supplier}
                    </td>

                    <td className="px-3 py-2.5">
                      {formatMoney(note.total)}
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      <ReturnNoteStatusBadge status={note.status} />
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpen(note.id);
                          }}
                          className="rounded-[5px] bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover active:translate-y-px"
                        >
                          Seleccionar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredReturnNotes.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No return notes available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 pl-2 text-xs text-muted-foreground">
        Mostrando {filteredReturnNotes.length} of {returnNotes.length} resultados
      </p>
    </div>
  );
}