"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAccountingProcesses,
  getChartOfAccounts,
} from "@/lib/http/client/accounting";

const inputBaseClass =
  "w-full rounded-[5px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all duration-200 " +
  "placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15";

function FolderIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function FileIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function ChevronIcon({ className = "" }) {
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
      <path d="m9 18 6-6-6-6" />
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

function AccountTypeBadge({ isPostable }) {
  return (
    <span
      className={`inline-flex min-w-[92px] items-center justify-center rounded-[5px] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${
        isPostable
          ? "bg-primary/10 text-primary"
          : "bg-muted/15 text-muted-foreground"
      }`}
    >
      {isPostable ? "Asentable" : "Padre"}
    </span>
  );
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function getAccountLevel(accountNumber) {
  if (!accountNumber) return 1;
  return String(accountNumber).split(".").length;
}

function countAccounts(nodes = []) {
  let count = 0;

  for (const node of nodes) {
    count += 1;
    count += countAccounts(node.children || []);
  }

  return count;
}

function countPostableAccounts(nodes = []) {
  let count = 0;

  for (const node of nodes) {
    if (node.isPostable) count += 1;
    count += countPostableAccounts(node.children || []);
  }

  return count;
}

function countParentAccounts(nodes = []) {
  let count = 0;

  for (const node of nodes) {
    if (!node.isPostable) count += 1;
    count += countParentAccounts(node.children || []);
  }

  return count;
}

function getMaxDepth(nodes = [], currentDepth = 1) {
  let maxDepth = 0;

  for (const node of nodes) {
    const children = node.children || [];
    const nodeDepth = children.length
      ? getMaxDepth(children, currentDepth + 1)
      : currentDepth;

    maxDepth = Math.max(maxDepth, nodeDepth);
  }

  return maxDepth;
}

function collectExpandableIds(nodes = []) {
  const ids = [];

  for (const node of nodes) {
    if ((node.children || []).length > 0) {
      ids.push(node.id);
      ids.push(...collectExpandableIds(node.children));
    }
  }

  return ids;
}

function accountMatches(account, search) {
  if (!search) return true;

  const q = normalizeText(search);

  return (
    normalizeText(account.accountNumber).includes(q) ||
    normalizeText(account.name).includes(q) ||
    normalizeText(account.id).includes(q)
  );
}

function filterTree(nodes = [], search) {
  return nodes
    .map((node) => {
      const filteredChildren = filterTree(node.children || [], search);
      const matches = accountMatches(node, search);

      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    })
    .filter(Boolean);
}

function flattenVisibleTree(nodes = [], expandedIds, depth = 0) {
  const rows = [];

  for (const node of nodes) {
    const children = node.children || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(node.id);

    rows.push({
      ...node,
      depth,
      hasChildren,
      isExpanded,
      level: getAccountLevel(node.accountNumber),
    });

    if (hasChildren && isExpanded) {
      rows.push(...flattenVisibleTree(children, expandedIds, depth + 1));
    }
  }

  return rows;
}

function getLatestProcess(processes = []) {
  if (!processes.length) return null;

  return [...processes].sort(
    (a, b) => Number(b.fiscalYear || 0) - Number(a.fiscalYear || 0)
  )[0];
}

export default function ChartOfAccountsPage() {
  const [processes, setProcesses] = useState([]);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [accountsTree, setAccountsTree] = useState([]);

  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const processData = await getAccountingProcesses();
        const latestProcess = getLatestProcess(processData || []);

        if (!latestProcess) {
          if (!ignore) {
            setProcesses([]);
            setCurrentProcess(null);
            setAccountsTree([]);
          }
          return;
        }

        const accountData = await getChartOfAccounts({
          accountingProcessId: latestProcess.id,
          tree: true,
        });

        if (!ignore) {
          setProcesses(processData || []);
          setCurrentProcess(latestProcess);
          setAccountsTree(accountData || []);

          const ids = collectExpandableIds(accountData || []);
          setExpandedIds(new Set(ids));
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error.message || "No se pudo cargar el plan de cuentas."
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredTree = useMemo(() => {
    return filterTree(accountsTree, search);
  }, [accountsTree, search]);

  const visibleRows = useMemo(() => {
    return flattenVisibleTree(filteredTree, expandedIds);
  }, [filteredTree, expandedIds]);

  const totalAccounts = useMemo(() => countAccounts(accountsTree), [accountsTree]);
  const totalPostable = useMemo(
    () => countPostableAccounts(accountsTree),
    [accountsTree]
  );
  const totalParents = useMemo(
    () => countParentAccounts(accountsTree),
    [accountsTree]
  );
  const maxDepth = useMemo(() => getMaxDepth(accountsTree), [accountsTree]);

  const hasFilters = search.trim();

  const toggleExpanded = (accountId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }

      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(collectExpandableIds(filteredTree)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const clearFilters = () => {
    setSearch("");
    setExpandedIds(new Set(collectExpandableIds(accountsTree)));
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-4 md:p-6">
      {/* Title */}
      <div className="mb-4 flex shrink-0 basis-[14%] flex-col gap-4 overflow-hidden lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[42px]">
            Plan de Cuentas
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Consulta la estructura contable del periodo actual.
          </p>

          <div className="mt-2 h-px w-full bg-foreground/80" />
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="h-10 rounded-[5px] bg-primary px-4 text-sm font-semibold text-primary-foreground opacity-50"
            title="La creación de cuentas está desactivada por ahora"
          >
            + Agregar nueva cuenta
          </button>

          <button
            type="button"
            disabled
            className="h-10 rounded-[5px] border border-border bg-surface px-4 text-sm font-semibold text-secondary opacity-60 shadow-panel"
            title="La exportación todavía no está disponible"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
        {/* Left column */}
        <aside className="hidden min-h-0 flex-col gap-5 overflow-hidden xl:flex">
          <div className="shrink-0 rounded-[5px] border border-border bg-surface p-4 shadow-panel">
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-secondary">
              Filtros de cuenta
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary">
                  Buscar cuenta
                </label>

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setExpandedIds(new Set(collectExpandableIds(accountsTree)));
                  }}
                  placeholder="Nombre, número o ID"
                  className={inputBaseClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary">
                  Proceso contable actual
                </label>

                <div className="flex h-10 items-center rounded-[5px] border border-border bg-background px-3 text-sm font-semibold text-foreground">
                  {currentProcess
                    ? `Ejercicio ${currentProcess.fiscalYear}`
                    : "Sin proceso activo"}
                </div>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-10 w-full cursor-pointer rounded-[5px] border border-border bg-surface px-4 text-sm font-semibold text-secondary transition hover:bg-background"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          <div className="shrink-0 rounded-[5px] border border-border bg-background p-4">
            <div className="flex gap-3">
              <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />

              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-foreground">
                  Consejo
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Las cuentas marcadas como asentables son las cuentas finales que
                  pueden recibir movimientos contables. Las cuentas padre agrupan
                  saldos y ayudan a ordenar el plan.
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 rounded-[5px] border border-border bg-surface p-4 shadow-panel">
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-secondary">
              Resumen
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total cuentas</span>
                <span className="font-extrabold text-foreground">
                  {totalAccounts}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Asentables</span>
                <span className="font-extrabold text-primary">
                  {totalPostable}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Padres</span>
                <span className="font-extrabold text-secondary">
                  {totalParents}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Profundidad</span>
                <span className="font-extrabold text-foreground">
                  {maxDepth} niveles
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <section className="flex min-h-0 flex-col overflow-hidden">
          <div className="mb-4 flex shrink-0 basis-[12%] flex-col gap-3 overflow-hidden rounded-[5px] border border-border bg-surface p-4 shadow-panel md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-secondary">
                Cuentas del periodo actual
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                {currentProcess
                  ? `Mostrando el plan de cuentas del ejercicio fiscal ${currentProcess.fiscalYear}.`
                  : "No se encontró un proceso contable activo."}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="h-9 rounded-[5px] border border-border bg-surface px-3 text-xs font-semibold text-secondary transition hover:bg-background"
              >
                Abrir todos
              </button>

              <button
                type="button"
                onClick={collapseAll}
                className="h-9 rounded-[5px] border border-border bg-surface px-3 text-xs font-semibold text-secondary transition hover:bg-background"
              >
                Cerrar todos
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="mb-4 shrink-0 rounded-[5px] border border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
              Cargando plan de cuentas...
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 shrink-0 rounded-[5px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="sticky top-0 z-10 bg-background text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="w-[80px] border-b border-border px-4 py-3 text-center">
                      Nivel
                    </th>

                    <th className="w-[180px] border-b border-border px-4 py-3 text-left">
                      Nro. de cuenta
                    </th>

                    <th className="border-b border-border px-4 py-3 text-left">
                      Nombre de cuenta
                    </th>

                    <th className="w-[130px] border-b border-border px-4 py-3 text-center">
                      Tipo
                    </th>

                    <th className="w-[120px] border-b border-border px-4 py-3 text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleRows.map((account) => {
                    const canExpand = account.hasChildren;

                    return (
                      <tr
                        key={account.id}
                        className="border-b border-border bg-surface text-sm text-foreground transition hover:bg-background"
                      >
                        <td className="px-4 py-3 text-center font-semibold text-secondary">
                          {account.level}
                        </td>

                        <td className="px-4 py-3 font-semibold">
                          {account.accountNumber}
                        </td>

                        <td className="px-4 py-3">
                          <div
                            className="flex items-center gap-2"
                            style={{ paddingLeft: `${account.depth * 22}px` }}
                          >
                            {canExpand ? (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(account.id)}
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                              >
                                <ChevronIcon
                                  className={`h-4 w-4 transition-transform ${
                                    account.isExpanded ? "rotate-90" : ""
                                  }`}
                                />
                              </button>
                            ) : (
                              <span className="h-6 w-6 shrink-0" />
                            )}

                            {account.isPostable ? (
                              <FileIcon className="h-4 w-4 shrink-0 text-secondary" />
                            ) : (
                              <FolderIcon className="h-4 w-4 shrink-0 text-secondary" />
                            )}

                            <span
                              className={`truncate ${
                                account.isPostable
                                  ? "font-medium"
                                  : "font-extrabold"
                              }`}
                              title={account.name}
                            >
                              {account.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <AccountTypeBadge isPostable={account.isPostable} />
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            disabled
                            className="rounded-[5px] border border-border px-3 py-1 text-xs font-semibold text-muted-foreground opacity-60"
                            title="La edición de cuentas está desactivada por ahora"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {visibleRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        No hay cuentas disponibles para el periodo actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="shrink-0 border-t border-border bg-surface px-4 py-2 text-xs text-muted-foreground">
              Mostrando {visibleRows.length} de {totalAccounts} cuentas del
              periodo actual
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}