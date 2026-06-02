"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccountingProcesses } from "@/lib/http/client/accounting";

const PROCESS_TABS = {
  ALL: "Todos",
  ACTIVE: "Activos",
  ARCHIVED: "Archivados",
};

const inputBaseClass =
  "w-full rounded-[5px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all duration-200 " +
  "placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15";

function formatDate(dateString) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-PY").format(Number(value || 0));
}

function DotsIcon({ className = "" }) {
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
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function EyeIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function StructureIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="5" height="5" rx="1" />
      <rect x="15" y="4" width="5" height="5" rx="1" />
      <rect x="9.5" y="15" width="5" height="5" rx="1" />
      <path d="M9 6.5h6" />
      <path d="M12 9v6" />
    </svg>
  );
}

function InfoIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function ProcessStatusBadge({ status }) {
  const isActive = status === "OPEN";

  return (
    <span
      className={`inline-flex min-w-[86px] items-center justify-center rounded-[5px] px-2.5 py-1 text-[11px] font-extrabold tracking-wide ${
        isActive
          ? "bg-primary/10 text-primary"
          : "bg-muted/15 text-muted-foreground"
      }`}
    >
      {isActive ? "ABIERTO" : "ARCHIVADO"}
    </span>
  );
}

function processToRow(process, latestFiscalYear) {
  const isActive = process.fiscalYear === latestFiscalYear;

  return {
    id: process.id,
    fiscalYear: process.fiscalYear,
    periodCode: String(process.fiscalYear),
    description: process.description || `Ejercicio fiscal ${process.fiscalYear}`,
    accountLevelsCount: Number(process.accountLevelsCount || 0),
    digitsPerLevel: Number(process.digitsPerLevel || 0),
    createdAt: process.createdAt,
    status: isActive ? "OPEN" : "ARCHIVED",
    raw: process,
  };
}

function calculateCapacity(levels, digits) {
  const safeLevels = Number(levels || 0);
  const safeDigits = Number(digits || 0);

  if (safeLevels <= 0 || safeDigits <= 0) return 0;

  const totalDigits = safeLevels * safeDigits;

  if (totalDigits > 12) return Math.pow(10, 12) - 1;

  return Math.pow(10, totalDigits) - 1;
}

export default function AccountingProcessesPage() {
  const router = useRouter();

  const [processes, setProcesses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [activeTab, setActiveTab] = useState(PROCESS_TABS.ALL);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadProcesses() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const data = await getAccountingProcesses();

        if (!ignore) {
          setProcesses(data || []);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error.message || "No se pudieron cargar los procesos contables."
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadProcesses();

    return () => {
      ignore = true;
    };
  }, []);

  const latestFiscalYear = useMemo(() => {
    if (!processes.length) return null;

    return Math.max(...processes.map((process) => Number(process.fiscalYear || 0)));
  }, [processes]);

  const rows = useMemo(() => {
    return processes.map((process) => processToRow(process, latestFiscalYear));
  }, [processes, latestFiscalYear]);

  const selectedProcess = useMemo(() => {
    return rows.find((process) => process.id === selectedId) || rows[0] || null;
  }, [rows, selectedId]);

  const counts = useMemo(() => {
    return {
      [PROCESS_TABS.ALL]: rows.length,
      [PROCESS_TABS.ACTIVE]: rows.filter((process) => process.status === "OPEN").length,
      [PROCESS_TABS.ARCHIVED]: rows.filter((process) => process.status === "ARCHIVED").length,
    };
  }, [rows]);

  const filteredProcesses = useMemo(() => {
    return rows.filter((process) => {
      if (activeTab === PROCESS_TABS.ACTIVE && process.status !== "OPEN") return false;
      if (activeTab === PROCESS_TABS.ARCHIVED && process.status !== "ARCHIVED") return false;

      if (search.trim()) {
        const q = search.toLowerCase();

        const matches =
          process.periodCode.toLowerCase().includes(q) ||
          process.description.toLowerCase().includes(q) ||
          process.status.toLowerCase().includes(q) ||
          String(process.accountLevelsCount).includes(q) ||
          String(process.digitsPerLevel).includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [rows, activeTab, search]);

  const clearFilters = () => {
    setSearch("");
    setActiveTab(PROCESS_TABS.ALL);
    setSelectedId(null);
  };

  const handleSelect = (id) => {
    setSelectedId(id === selectedId ? null : id);
  };

  const handleOpenChart = (processId) => {
    router.push(
      `/accounting/chart-of-accounts?accountingProcessId=${processId}&tree=true`
    );
  };

  const chartCapacity = selectedProcess
    ? calculateCapacity(
        selectedProcess.accountLevelsCount,
        selectedProcess.digitsPerLevel
      )
    : 0;

  const tabs = [PROCESS_TABS.ALL, PROCESS_TABS.ACTIVE, PROCESS_TABS.ARCHIVED];

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[5px] bg-surface p-4 md:p-6">
      {/* Title */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[42px]">
            Proceso Contable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Configurá el ciclo fiscal y la estructura del plan de cuentas.
          </p>

          <div className="mt-2 h-px w-full bg-foreground/80" />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled
            className="h-10 rounded-[5px] border border-border bg-muted/15 px-4 text-sm font-semibold text-muted-foreground opacity-70"
            title="La auditoría todavía no está disponible"
          >
            Auditoría
          </button>

          <button
            type="button"
            disabled
            className="h-10 rounded-[5px] bg-primary px-4 text-sm font-semibold text-primary-foreground opacity-50"
            title="La creación de procesos contables está desactivada por ahora"
          >
            + Nuevo proceso
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* Main column */}
        <div className="flex min-h-0 flex-col">
          {/* Filters */}
          <div className="mb-5 rounded-[5px] border border-border bg-surface p-4 shadow-panel">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary">
                  Búsqueda
                </label>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por periodo, descripción, estado..."
                  className={inputBaseClass}
                />
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-[5px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-background"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-5 rounded-[5px] border border-border bg-surface p-2 shadow-panel">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;

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

                    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-muted/15 px-1.5 text-xs font-semibold text-muted-foreground">
                      {counts[tab]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading / Error */}
          {isLoading && (
            <div className="mb-4 rounded-[5px] border border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
              Cargando procesos contables...
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {/* Table */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-secondary">
                Periodos contables
              </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="sticky top-0 z-10 bg-background text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="w-[120px] border-b border-border px-5 py-3 text-left">
                      Periodo
                    </th>
                    <th className="border-b border-border px-5 py-3 text-left">
                      Descripción
                    </th>
                    <th className="w-[130px] border-b border-border px-5 py-3 text-center">
                      Estado
                    </th>
                    <th className="w-[120px] border-b border-border px-5 py-3 text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProcesses.map((process) => {
                    const isSelected = selectedId === process.id;

                    return (
                      <tr
                        key={process.id}
                        onClick={() => handleSelect(process.id)}
                        className={`cursor-pointer border-b border-border text-sm text-foreground transition-colors duration-150 ${
                          isSelected
                            ? "bg-primary/10"
                            : "bg-surface hover:bg-background"
                        }`}
                      >
                        <td className="px-5 py-4 font-extrabold text-secondary">
                          {process.periodCode}
                        </td>

                        <td className="px-5 py-4">
                          <div className="line-clamp-2 font-medium">
                            {process.description}
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            Creado el {formatDate(process.createdAt)}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <ProcessStatusBadge status={process.status} />
                        </td>

                        <td className="px-5 py-4 text-center">
                          {isSelected ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenChart(process.id);
                              }}
                              className="inline-flex items-center justify-center rounded-[5px] bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover active:translate-y-px"
                            >
                              Ver plan
                            </button>
                          ) : process.status === "OPEN" ? (
                            <DotsIcon className="mx-auto h-5 w-5 text-muted-foreground" />
                          ) : (
                            <EyeIcon className="mx-auto h-5 w-5 text-muted-foreground" />
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredProcesses.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        No hay procesos contables disponibles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border px-5 py-4 text-center">
              <button
                type="button"
                onClick={() => setActiveTab(PROCESS_TABS.ALL)}
                className="text-xs font-extrabold uppercase tracking-[0.12em] text-secondary transition hover:text-primary"
              >
                Ver todos los periodos históricos
              </button>
            </div>
          </div>

          <p className="mt-3 pl-2 text-xs text-muted-foreground">
            Mostrando {filteredProcesses.length} de {rows.length} resultados
          </p>
        </div>

        {/* Right column */}
        <aside className="space-y-5">
          <div className="rounded-[5px] border border-border bg-surface p-5 shadow-panel">
            <div className="mb-5 flex items-center gap-3">
              <StructureIcon className="h-6 w-6 text-secondary" />

              <h2 className="text-sm font-extrabold uppercase tracking-[0.08em] text-foreground">
                Estructura del plan
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                  Plan de cuentas niveles
                </label>

                <div className="flex h-11 items-center justify-between rounded-[5px] bg-primary/10 px-4 text-sm font-extrabold text-foreground">
                  <span>{selectedProcess?.accountLevelsCount || "-"}</span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Niveles
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                  Dígitos por nivel
                </label>

                <div className="flex h-11 items-center justify-between rounded-[5px] bg-primary/10 px-4 text-sm font-extrabold text-foreground">
                  <span>{selectedProcess?.digitsPerLevel || "-"}</span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Dígitos
                  </span>
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Define el formato de numeración de cuentas. Ejemplo:
                  01.01.01.01
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[5px] bg-primary p-5 text-primary-foreground shadow-panel">
            <h2 className="mb-5 text-sm font-extrabold uppercase tracking-[0.18em]">
              Vista previa de estructura
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-primary-foreground/80">
                  Capacidad total
                </span>
                <span className="font-semibold">
                  {formatNumber(chartCapacity)} cuentas
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-primary-foreground/80">
                  Profundidad
                </span>
                <span className="font-semibold">
                  {selectedProcess?.accountLevelsCount || 0} niveles
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-primary-foreground/80">
                  Validación
                </span>
                <span className="font-semibold text-success">
                  {selectedProcess ? "Activa" : "Sin datos"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[5px] border border-border bg-background p-5">
            <div className="flex gap-3">
              <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />

              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-foreground">
                  Cierre automático de periodos
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  El sistema puede bloquear movimientos contables hasta la fecha
                  del último cierre. Los asientos anteriores o iguales a esa
                  fecha no deberían modificarse.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}