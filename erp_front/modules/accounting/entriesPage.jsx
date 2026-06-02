"use client";

import { useEffect, useMemo, useState } from "react";
import { getJournalEntries } from "@/lib/http/client/accounting";

import { useRouter } from "next/navigation";

const inputBaseClass =
  "w-full rounded-[5px] border border-border bg-background px-3 py-2 text-xs text-foreground outline-none transition-all duration-200 " +
  "placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15";

function formatDate(dateString) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeEntry(entry) {
  const details = entry.details || entry.journalEntryDetails || [];

  return {
    id: entry.id,
    entryNumber: entry.entryNumber || entry.entry_number || entry.id,
    entryDate: entry.entryDate || entry.entry_date,
    description: entry.description || "Sin descripción",
    isAutomatic: Boolean(entry.isAutomatic ?? entry.is_automatic),
    createdAt: entry.createdAt || entry.created_at,
    details: details.map((detail) => {
      const account = detail.account || detail.chartAccount || {};

      return {
        id: detail.id,
        accountId: account.id || detail.accountId || detail.account_id,
        accountNumber:
          account.accountNumber ||
          account.account_number ||
          detail.accountNumber ||
          detail.account_number ||
          "-",
        accountName:
          account.name ||
          detail.accountName ||
          detail.account_name ||
          "Cuenta no especificada",
        amount: Number(detail.amount || 0),
        isDebit: Boolean(detail.isDebit ?? detail.is_debit),
        lineNumber: detail.lineNumber || detail.line_number || 0,
        lineDescription:
          detail.lineDescription ||
          detail.line_description ||
          "Sin descripción",
      };
    }),
    raw: entry,
  };
}

function getDebitTotal(details = []) {
  return details
    .filter((detail) => detail.isDebit)
    .reduce((sum, detail) => sum + Number(detail.amount || 0), 0);
}

function getCreditTotal(details = []) {
  return details
    .filter((detail) => !detail.isDebit)
    .reduce((sum, detail) => sum + Number(detail.amount || 0), 0);
}

function getBalanceStatus(entry) {
  const debit = getDebitTotal(entry.details);
  const credit = getCreditTotal(entry.details);

  return Math.abs(debit - credit) < 0.01 ? "Balanceado" : "Descuadrado";
}

function EntryTypeBadge({ isAutomatic }) {
  return (
    <span
      className={`inline-flex min-w-[88px] items-center justify-center rounded-[5px] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
        isAutomatic
          ? "bg-primary/10 text-primary"
          : "bg-muted/15 text-muted-foreground"
      }`}
    >
      {isAutomatic ? "Automático" : "Manual"}
    </span>
  );
}

function BalanceBadge({ status }) {
  const isBalanced = status === "Balanceado";

  return (
    <span
      className={`inline-flex min-w-[88px] items-center justify-center rounded-[5px] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
        isBalanced
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {status}
    </span>
  );
}

function DebitCreditBadge({ isDebit }) {
  return (
    <span className="inline-flex overflow-hidden rounded-[5px] bg-muted/15 p-0.5 text-[9px] font-extrabold uppercase tracking-wide">
      <span
        className={`rounded-[4px] px-1.5 py-0.5 ${
          isDebit
            ? "bg-surface text-primary shadow-panel"
            : "text-muted-foreground"
        }`}
      >
        Debe
      </span>

      <span
        className={`rounded-[4px] px-1.5 py-0.5 ${
          !isDebit
            ? "bg-surface text-primary shadow-panel"
            : "text-muted-foreground"
        }`}
      >
        Haber
      </span>
    </span>
  );
}

export default function JournalEntriesPage() {
  const router = useRouter();

  const [entries, setEntries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadJournalEntries() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const data = await getJournalEntries(search);
        const mapped = (data || []).map(normalizeEntry);

        if (!ignore) {
          setEntries(mapped);
          setSelectedId((current) => current || mapped[0]?.id || null);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error.message || "No se pudieron cargar los asientos contables."
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    const timeoutId = setTimeout(loadJournalEntries, 300);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [search]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (typeFilter === "automatic" && !entry.isAutomatic) return false;
      if (typeFilter === "manual" && entry.isAutomatic) return false;

      const balanceStatus = getBalanceStatus(entry);

      if (balanceFilter !== "all" && balanceStatus !== balanceFilter) {
        return false;
      }

      const q = normalizeText(search);

      if (q) {
        const matches =
          normalizeText(entry.id).includes(q) ||
          normalizeText(entry.entryNumber).includes(q) ||
          normalizeText(entry.description).includes(q) ||
          normalizeText(entry.entryDate).includes(q) ||
          entry.details.some(
            (detail) =>
              normalizeText(detail.accountNumber).includes(q) ||
              normalizeText(detail.accountName).includes(q) ||
              normalizeText(detail.lineDescription).includes(q)
          );

        if (!matches) return false;
      }

      return true;
    });
  }, [entries, search, typeFilter, balanceFilter]);

  const selectedEntry = useMemo(() => {
    return (
      entries.find((entry) => entry.id === selectedId) ||
      filteredEntries[0] ||
      entries[0] ||
      null
    );
  }, [entries, filteredEntries, selectedId]);

  const summary = useMemo(() => {
    return {
      total: entries.length,
      manual: entries.filter((entry) => !entry.isAutomatic).length,
      automatic: entries.filter((entry) => entry.isAutomatic).length,
      balanced: entries.filter((entry) => getBalanceStatus(entry) === "Balanceado")
        .length,
    };
  }, [entries]);

  const selectedDebitTotal = selectedEntry
    ? getDebitTotal(selectedEntry.details)
    : 0;

  const selectedCreditTotal = selectedEntry
    ? getCreditTotal(selectedEntry.details)
    : 0;

  const selectedDifference = selectedDebitTotal - selectedCreditTotal;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setBalanceFilter("all");
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 md:p-4">
      {/* Header */}
      <div className="mb-3 flex shrink-0 flex-col gap-3 overflow-hidden lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold leading-none tracking-tight text-foreground md:text-[34px]">
            Asientos Contables
          </h1>

          <p className="mt-1.5 max-w-3xl text-xs text-muted-foreground">
            Consulta los movimientos contables manuales y automáticos registrados
            en el sistema.
          </p>

          <div className="mt-2 h-px w-full bg-foreground/80" />
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="h-8 rounded-[5px] border border-border bg-muted/15 px-3 text-xs font-semibold text-muted-foreground opacity-70"
            title="La exportación todavía no está disponible"
          >
            Exportar
          </button>

          <button
            type="button"
            onClick={() => router.push("/accounting/entries/new")}
            className="h-8 rounded-[5px] bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover active:translate-y-px"
          >
            + Nuevo asiento
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_430px]">
        {/* Left table */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
          <div className="shrink-0 border-b border-border p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_160px_160px_auto] md:items-end">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-secondary">
                  Buscar asiento
                </label>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Número, descripción, cuenta..."
                  className={inputBaseClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-secondary">
                  Tipo
                </label>

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className={inputBaseClass}
                >
                  <option value="all">Todos</option>
                  <option value="automatic">Automáticos</option>
                  <option value="manual">Manuales</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-secondary">
                  Balance
                </label>

                <select
                  value={balanceFilter}
                  onChange={(event) => setBalanceFilter(event.target.value)}
                  className={inputBaseClass}
                >
                  <option value="all">Todos</option>
                  <option value="Balanceado">Balanceados</option>
                  <option value="Descuadrado">Descuadrados</option>
                </select>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="h-8 rounded-[5px] border border-border bg-surface px-3 text-xs font-semibold text-secondary transition hover:bg-background"
              >
                Limpiar
              </button>
            </div>

            {isLoading && (
              <div className="mt-3 rounded-[5px] border border-border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                Cargando asientos contables...
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 rounded-[5px] border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="sticky top-0 z-10 bg-background text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="w-[90px] border-b border-border px-3 py-2 text-left">
                    Número
                  </th>

                  <th className="w-[110px] border-b border-border px-3 py-2 text-left">
                    Fecha
                  </th>

                  <th className="border-b border-border px-3 py-2 text-left">
                    Descripción
                  </th>

                  <th className="w-[105px] border-b border-border px-3 py-2 text-center">
                    Tipo
                  </th>

                  <th className="w-[105px] border-b border-border px-3 py-2 text-center">
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEntries.map((entry) => {
                  const active = selectedEntry?.id === entry.id;
                  const balanceStatus = getBalanceStatus(entry);

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedId(entry.id)}
                      className={`cursor-pointer border-b border-border text-xs text-foreground transition ${
                        active
                          ? "bg-primary/10"
                          : "bg-surface hover:bg-background"
                      }`}
                    >
                      <td className="px-3 py-2.5 font-extrabold text-secondary">
                        {String(entry.entryNumber).padStart(4, "0")}
                      </td>

                      <td className="px-3 py-2.5">
                        {formatDate(entry.entryDate)}
                      </td>

                      <td className="truncate px-3 py-2.5" title={entry.description}>
                        {entry.description}
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <EntryTypeBadge isAutomatic={entry.isAutomatic} />
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <BalanceBadge status={balanceStatus} />
                      </td>
                    </tr>
                  );
                })}

                {filteredEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-xs text-muted-foreground"
                    >
                      No hay asientos contables disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="shrink-0 border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
            Mostrando {filteredEntries.length} de {entries.length} asientos
          </div>
        </section>

        {/* Right detail */}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
          {selectedEntry ? (
            <>
              <div className="shrink-0 border-b border-border p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-extrabold text-foreground">
                      Asiento #{String(selectedEntry.entryNumber).padStart(4, "0")}
                    </h2>

                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Fecha: {formatDate(selectedEntry.entryDate)}
                    </p>
                  </div>

                  <EntryTypeBadge isAutomatic={selectedEntry.isAutomatic} />
                </div>

                <div className="rounded-[5px] bg-background px-3 py-2">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                    Descripción
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                    {selectedEntry.description}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-[5px] bg-primary/10 px-3 py-2">
                    <p className="text-[9px] font-extrabold uppercase text-primary">
                      Debe
                    </p>
                    <p className="mt-1 truncate text-xs font-extrabold text-foreground">
                      {formatMoney(selectedDebitTotal)}
                    </p>
                  </div>

                  <div className="rounded-[5px] bg-muted/10 px-3 py-2">
                    <p className="text-[9px] font-extrabold uppercase text-muted-foreground">
                      Haber
                    </p>
                    <p className="mt-1 truncate text-xs font-extrabold text-foreground">
                      {formatMoney(selectedCreditTotal)}
                    </p>
                  </div>

                  <div
                    className={`rounded-[5px] px-3 py-2 ${
                      Math.abs(selectedDifference) < 0.01
                        ? "bg-success/10"
                        : "bg-destructive/10"
                    }`}
                  >
                    <p
                      className={`text-[9px] font-extrabold uppercase ${
                        Math.abs(selectedDifference) < 0.01
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      Dif.
                    </p>
                    <p className="mt-1 truncate text-xs font-extrabold text-foreground">
                      {formatMoney(selectedDifference)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
                <div className="mb-2 flex shrink-0 items-center justify-between">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-secondary">
                    Detalle del asiento
                  </h3>

                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {selectedEntry.details.length} líneas
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-auto rounded-[5px] border border-border">
                  <table className="w-full table-fixed border-collapse">
                    <thead>
                      <tr className="sticky top-0 z-10 bg-background text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                        <th className="w-[140px] border-b border-border px-3 py-2 text-left">
                          Cuenta
                        </th>

                        <th className="w-[82px] border-b border-border px-3 py-2 text-center">
                          Tipo
                        </th>

                        <th className="w-[105px] border-b border-border px-3 py-2 text-right">
                          Monto
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedEntry.details.map((detail) => (
                        <tr
                          key={`${selectedEntry.id}-${detail.lineNumber}-${detail.accountId}`}
                          className="border-b border-border bg-surface text-xs text-foreground transition hover:bg-background"
                        >
                          <td className="px-3 py-2.5">
                            <p className="truncate font-extrabold text-secondary">
                              {detail.accountNumber}
                            </p>

                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                              {detail.accountName}
                            </p>

                            <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
                              {detail.lineDescription}
                            </p>
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            <DebitCreditBadge isDebit={detail.isDebit} />
                          </td>

                          <td className="px-3 py-2.5 text-right font-extrabold">
                            {formatMoney(detail.amount)}
                          </td>
                        </tr>
                      ))}

                      {selectedEntry.details.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="py-10 text-center text-xs text-muted-foreground"
                          >
                            Este asiento no tiene detalles.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex shrink-0 justify-end gap-2">
                  <button
                    type="button"
                    disabled={selectedEntry.isAutomatic}
                    onClick={() => router.push(`/accounting/entries/${selectedEntry.id}/edit`)}
                    className="h-8 rounded-[5px] border border-border bg-surface px-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-secondary transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    disabled
                    className="h-8 rounded-[5px] bg-primary px-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary-foreground opacity-50"
                    title="La impresión todavía no está disponible"
                  >
                    Imprimir
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
              Seleccioná un asiento contable para ver sus detalles.
            </div>
          )}
        </aside>
      </div>

      {/* Compact summary */}
      <div className="mt-3 grid shrink-0 grid-cols-2 gap-2 text-[10px] text-muted-foreground md:grid-cols-4">
        <div className="rounded-[5px] bg-background px-3 py-2">
          <p className="font-extrabold text-foreground">{summary.total}</p>
          <p>Total asientos</p>
        </div>

        <div className="rounded-[5px] bg-background px-3 py-2">
          <p className="font-extrabold text-primary">{summary.automatic}</p>
          <p>Automáticos</p>
        </div>

        <div className="rounded-[5px] bg-background px-3 py-2">
          <p className="font-extrabold text-secondary">{summary.manual}</p>
          <p>Manuales</p>
        </div>

        <div className="rounded-[5px] bg-background px-3 py-2">
          <p className="font-extrabold text-success">{summary.balanced}</p>
          <p>Balanceados</p>
        </div>
      </div>
    </div>
  );
}