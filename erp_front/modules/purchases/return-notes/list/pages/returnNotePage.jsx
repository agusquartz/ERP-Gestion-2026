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
      className={`inline-flex min-w-[96px] items-center justify-center gap-2 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${border} ${bg} ${text}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
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

// CAMBIO: inputs alineados al estilo de DocumentsSearch
const inputBaseClass =
  "w-full rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#2b6df5] focus:ring-2 focus:ring-[#2b6df5]/10";

// CAMBIO: botones dropdown alineados al estilo de DocumentsSearch
const dropdownButtonClass =
  "flex min-w-[150px] items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-[14px] font-bold text-slate-700 transition-colors hover:bg-slate-100";

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
    // CAMBIO: mismo contenedor responsive que DocumentsPage
    <div className="flex h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 sm:h-[calc(100dvh-24px)] sm:p-4 md:h-[calc(100dvh-48px)] md:p-6">
      {/* Title */}
      <div className="mb-5 shrink-0">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground sm:text-[28px] md:text-[32px]">
          Notas de Devolución
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Consultá devoluciones de productos registradas a partir de facturas de compra.
        </p>

        <div className="mt-2 h-px w-full bg-border" />
      </div>

      {/* CAMBIO: filtros con estilo tipo DocumentsSearch */}
      <div className="w-full shrink-0 space-y-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_auto_auto_auto] lg:items-end">
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[13px] font-bold text-slate-800">
              Búsqueda
            </label>

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCursor(INITIAL_CURSOR);
              }}
              placeholder="Buscar por nota de devolución, factura, proveedor..."
              className={inputBaseClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[13px] font-bold text-slate-800">
              Filtrar resultados
            </label>

            <input
              value={secondaryFilter}
              onChange={(event) => setSecondaryFilter(event.target.value)}
              placeholder="Filtrar por nota, factura..."
              className={inputBaseClass}
            />
          </div>

          <div className="relative flex flex-col gap-1.5">
            <label className="ml-1 text-[13px] font-bold text-slate-800">
              Fecha
            </label>

            <button
              type="button"
              onClick={() => {
                setShowDateDrop((prev) => !prev);
                setShowStatusDrop(false);
              }}
              className={dropdownButtonClass}
            >
              <span>
                {fromDateFilter || toDateFilter ? "Rango de fecha" : "Fecha"}
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${
                  showDateDrop ? "rotate-180" : ""
                }`}
              />
            </button>

            {showDateDrop && (
              <div className="absolute z-20 mt-[74px] w-[240px] rounded-[10px] border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5">
                <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
                  Desde
                </label>

                <input
                  type="date"
                  value={fromDateFilter}
                  onChange={(event) => {
                    setFromDateFilter(event.target.value);
                    setCursor(INITIAL_CURSOR);
                  }}
                  className="w-full rounded-md border border-slate-200 px-2 py-1 text-[13px] text-slate-700 outline-none focus:border-[#2b6df5]"
                />

                <label className="mb-1 mt-3 block text-[11px] font-bold uppercase text-slate-400">
                  Hasta
                </label>

                <input
                  type="date"
                  value={toDateFilter}
                  onChange={(event) => {
                    setToDateFilter(event.target.value);
                    setCursor(INITIAL_CURSOR);
                  }}
                  className="w-full rounded-md border border-slate-200 px-2 py-1 text-[13px] text-slate-700 outline-none focus:border-[#2b6df5]"
                />

                <button
                  type="button"
                  onClick={() => {
                    setFromDateFilter("");
                    setToDateFilter("");
                    setCursor(INITIAL_CURSOR);
                    setShowDateDrop(false);
                  }}
                  className="mt-2 w-full rounded-md px-3 py-2 text-left text-[14px] font-medium text-slate-700 transition-colors hover:bg-[#f0f7ff] hover:text-[#2b6df5]"
                >
                  Todo
                </button>
              </div>
            )}
          </div>

          <div className="relative flex flex-col gap-1.5">
            <label className="ml-1 text-[13px] font-bold text-slate-800">
              Estado
            </label>

            <button
              type="button"
              onClick={() => {
                setShowStatusDrop((prev) => !prev);
                setShowDateDrop(false);
              }}
              className={dropdownButtonClass}
            >
              <span>{selectedStatus.label}</span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${
                  showStatusDrop ? "rotate-180" : ""
                }`}
              />
            </button>

            {showStatusDrop && (
              <div className="absolute z-20 mt-[74px] w-[180px] rounded-[10px] border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
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
                      className={`w-full rounded-md px-3 py-2 text-left text-[14px] font-medium transition-colors ${
                        isActive
                          ? "bg-[#f0f7ff] text-[#2b6df5]"
                          : "text-slate-700 hover:bg-[#f0f7ff] hover:text-[#2b6df5]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-[8px] border border-slate-300 px-6 py-2.5 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
          >
            Limpiar todo
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-[12px] text-slate-400">
            Mostrando resultados de búsqueda...
          </span>

          <span className="text-[11px] italic text-slate-400">
            Usá los filtros para consultar notas de devolución.
          </span>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="mb-4 shrink-0 rounded-[5px] border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Cargando notas de devolución...
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 shrink-0 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* CAMBIO: tabla igual al estilo de DocumentsTable */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full min-w-[1050px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[150px]" />
              <col className="w-[190px]" />
              <col className="w-[150px]" />
              <col />
              <col className="w-[150px]" />
              <col className="w-[150px]" />
              <col className="w-[140px]" />
            </colgroup>

            <thead>
              <tr className="bg-background">
                <th className="sticky top-0 border-b border-border bg-background px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Factura
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nota Devolución Nro
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fecha
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Proveedor
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>

                <th className="sticky top-0 border-b border-border bg-background px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredReturnNotes.map((note) => {
                const isSelected = selectedId === note.id;

                return (
                  <tr
                    key={note.id}
                    onClick={() => handleSelect(note.id)}
                    className={`group cursor-pointer border-b border-gray-100 transition-colors ${
                      isSelected ? "bg-[#f0f7ff]" : "hover:bg-[#f0f7ff]"
                    }`}
                  >
                    <td className="px-3 py-2.5 text-sm font-bold text-[#2b6df5]">
                      {note.purchaseInvoiceId}
                    </td>

                    <td className="px-3 py-2.5 text-sm font-bold text-foreground">
                      {note.returnNoteNumber}
                    </td>

                    <td className="px-3 py-2.5 text-sm text-foreground">
                      {formatDate(note.date)}
                    </td>

                    <td
                      className="truncate px-3 py-2.5 text-sm font-medium text-foreground"
                      title={note.supplier}
                    >
                      {note.supplier}
                    </td>

                    <td className="px-3 py-2.5 text-right text-sm font-bold text-foreground">
                      {formatMoney(note.total)}
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      <div className="flex justify-center">
                        <ReturnNoteStatusBadge status={note.status} />
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end">
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
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredReturnNotes.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-9 text-center text-sm text-muted-foreground"
                  >
                    No hay notas de devolución disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CAMBIO: footer igual al estilo de DocumentsTable */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            Mostrando {filteredReturnNotes.length} de {returnNotes.length} resultados
          </span>
        </div>
      </div>
    </div>
  );
}