"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getAccountingProcesses,
  getChartOfAccounts,
  getAccountingClosures,
  getJournalEntryById,
  updateJournalEntry,
} from "@/lib/http/client/accounting";

const inputBaseClass =
  "w-full rounded-[5px] border border-border bg-background px-3 py-2 text-xs text-foreground outline-none transition-all duration-200 " +
  "placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

function formatMoney(value) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizeEntry(entry) {
  const details = entry.details || entry.journalEntryDetails || [];

  return {
    id: entry.id,
    entryNumber: entry.entryNumber || entry.entry_number || entry.id,
    entryDate: entry.entryDate || entry.entry_date,
    description: entry.description || "",
    isAutomatic: Boolean(entry.isAutomatic ?? entry.is_automatic),
    createdAt: entry.createdAt || entry.created_at,
    details: details.map((detail, index) => {
      const account = detail.account || detail.chartAccount || {};

      return {
        clientId: `loaded-${detail.id || index}`,
        id: detail.id,
        accountId: account.id || detail.accountId || detail.account_id || "",
        amount: String(detail.amount || ""),
        isDebit: Boolean(detail.isDebit ?? detail.is_debit),
        lineNumber: detail.lineNumber || detail.line_number || index + 1,
        lineDescription:
          detail.lineDescription || detail.line_description || "",
      };
    }),
  };
}

function getLatestProcess(processes = []) {
  if (!processes.length) return null;

  return [...processes].sort(
    (a, b) => Number(b.fiscalYear || 0) - Number(a.fiscalYear || 0)
  )[0];
}

function flattenAccounts(nodes = []) {
  const result = [];

  function walk(items, depth = 0) {
    for (const item of items) {
      result.push({
        id: item.id,
        name: item.name,
        accountNumber: item.accountNumber || item.account_number,
        isPostable: Boolean(item.isPostable ?? item.is_postable),
        depth,
      });

      walk(item.children || [], depth + 1);
    }
  }

  walk(nodes);

  return result;
}

function createEmptyLine() {
  return {
    clientId: crypto.randomUUID(),
    accountId: "",
    amount: "",
    isDebit: true,
    lineDescription: "",
  };
}

function parseAmount(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDebitTotal(lines = []) {
  return lines
    .filter((line) => line.isDebit)
    .reduce((sum, line) => sum + parseAmount(line.amount), 0);
}

function getCreditTotal(lines = []) {
  return lines
    .filter((line) => !line.isDebit)
    .reduce((sum, line) => sum + parseAmount(line.amount), 0);
}

function isDateClosed(entryDate, closures = []) {
  if (!entryDate) return false;

  const targetDate = new Date(`${entryDate}T00:00:00`);

  return closures.some((closure) => {
    const closureDate = closure.closureDate || closure.closure_date;
    if (!closureDate) return false;

    return new Date(`${closureDate}T00:00:00`) >= targetDate;
  });
}

export default function EditJournalEntryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [accounts, setAccounts] = useState([]);
  const [closures, setClosures] = useState([]);

  const [entryNumber, setEntryNumber] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [description, setDescription] = useState("");
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [lines, setLines] = useState([createEmptyLine(), createEmptyLine()]);

  const [draggedIndex, setDraggedIndex] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [entryData, processData, closureData] = await Promise.all([
          getJournalEntryById(id),
          getAccountingProcesses(),
          getAccountingClosures(),
        ]);

        const normalized = normalizeEntry(entryData);
        const latestProcess = getLatestProcess(processData || []);

        let accountOptions = [];

        if (latestProcess) {
          const accountTree = await getChartOfAccounts({
            accountingProcessId: latestProcess.id,
            tree: true,
          });

          accountOptions = flattenAccounts(accountTree || []).filter(
            (account) => account.isPostable
          );
        }

        if (!ignore) {
          setEntryNumber(normalized.entryNumber);
          setEntryDate(normalized.entryDate);
          setDescription(normalized.description);
          setIsAutomatic(normalized.isAutomatic);
          setLines(
            normalized.details.length
              ? normalized.details
              : [createEmptyLine(), createEmptyLine()]
          );
          setAccounts(accountOptions);
          setClosures(closureData || []);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error.message || "No se pudo cargar el asiento contable."
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    if (id) loadData();

    return () => {
      ignore = true;
    };
  }, [id]);

  const isClosedPeriod = useMemo(
    () => isDateClosed(entryDate, closures),
    [entryDate, closures]
  );

  const canEdit = !isAutomatic && !isClosedPeriod;

  const debitTotal = useMemo(() => getDebitTotal(lines), [lines]);
  const creditTotal = useMemo(() => getCreditTotal(lines), [lines]);
  const difference = debitTotal - creditTotal;
  const isBalanced = Math.abs(difference) < 0.01;

  const updateLine = (clientId, patch) => {
    setLines((current) =>
      current.map((line) =>
        line.clientId === clientId ? { ...line, ...patch } : line
      )
    );
  };

  const addLine = () => {
    setLines((current) => [...current, createEmptyLine()]);
  };

  const removeLine = (clientId) => {
    setLines((current) => {
      if (current.length <= 2) return current;
      return current.filter((line) => line.clientId !== clientId);
    });
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setLines((current) => {
      const next = [...current];
      const [removed] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, removed);
      return next;
    });

    setDraggedIndex(null);
  };

  const validatePayload = () => {
    if (!canEdit) {
      return "Este asiento no puede editarse.";
    }

    if (!entryNumber || Number(entryNumber) <= 0) {
      return "El número de asiento debe ser válido.";
    }

    if (!entryDate) {
      return "La fecha del asiento es obligatoria.";
    }

    if (!description.trim()) {
      return "La descripción general es obligatoria.";
    }

    if (lines.length < 2) {
      return "El asiento debe tener al menos dos líneas.";
    }

    for (const [index, line] of lines.entries()) {
      if (!line.accountId) {
        return `La línea ${index + 1} debe tener una cuenta.`;
      }

      if (parseAmount(line.amount) <= 0) {
        return `La línea ${index + 1} debe tener un monto mayor a cero.`;
      }
    }

    if (!isBalanced) {
      return "El asiento debe estar balanceado: el Debe y el Haber deben ser iguales.";
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validatePayload();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const payload = {
      entryNumber: Number(entryNumber),
      entryDate,
      description: description.trim(),
      isAutomatic: false,
      details: lines.map((line, index) => ({
        accountId: Number(line.accountId),
        amount: String(parseAmount(line.amount)),
        isDebit: line.isDebit,
        lineNumber: index + 1,
        lineDescription: line.lineDescription?.trim() || null,
      })),
    };

    try {
      setIsSaving(true);
      setErrorMessage(null);

      await updateJournalEntry(id, payload);

      router.push("/accounting/entries");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error.message || "No se pudo actualizar el asiento contable."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-3rem)] items-center justify-center rounded-[5px] bg-surface p-4 text-sm text-muted-foreground">
        Cargando asiento contable...
      </div>
    );
  }

  if (!canEdit && !errorMessage) {
    return (
      <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-4">
        <div className="mb-4">
          <h1 className="text-[30px] font-extrabold leading-none text-foreground">
            Asiento no editable
          </h1>

          <p className="mt-2 text-xs text-muted-foreground">
            Este asiento no puede modificarse desde esta pantalla.
          </p>

          <div className="mt-2 h-px w-full bg-foreground/80" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-lg rounded-[5px] border border-border bg-background p-6 text-center shadow-panel">
            <h2 className="text-lg font-extrabold text-foreground">
              Edición bloqueada
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isAutomatic
                ? "Este asiento fue generado automáticamente por el sistema. Para mantener la integridad contable, no debe editarse manualmente."
                : "Este asiento pertenece a un periodo contable cerrado."}
            </p>

            <button
              type="button"
              onClick={() => router.push("/accounting/entries")}
              className="mt-5 h-9 rounded-[5px] bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              Volver a asientos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 md:p-4">
      {/* Header */}
      <div className="mb-3 flex shrink-0 flex-col gap-3 overflow-hidden lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold leading-none tracking-tight text-foreground md:text-[34px]">
            Editar Asiento
          </h1>

          <p className="mt-1.5 max-w-3xl text-xs text-muted-foreground">
            Modificá un asiento manual existente. Las líneas pueden reordenarse
            arrastrando las filas.
          </p>

          <div className="mt-2 h-px w-full bg-foreground/80" />
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-8 rounded-[5px] border border-border bg-surface px-3 text-xs font-semibold text-secondary transition hover:bg-background"
          >
            Atrás
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !canEdit}
            className="h-8 rounded-[5px] bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-3 shrink-0 rounded-[5px] border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_310px]">
        {/* Main editor */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
          <div className="shrink-0 border-b border-border p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[140px_170px_1fr_160px]">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-secondary">
                  Número
                </label>

                <input
                  type="number"
                  value={entryNumber}
                  onChange={(event) => setEntryNumber(event.target.value)}
                  disabled={!canEdit}
                  className={inputBaseClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-secondary">
                  Fecha
                </label>

                <input
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                  disabled={!canEdit}
                  className={inputBaseClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-secondary">
                  Descripción general
                </label>

                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={!canEdit}
                  placeholder="Ej.: Ajuste manual de caja"
                  className={inputBaseClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-secondary">
                  Tipo
                </label>

                <div className="flex h-8 items-center rounded-[5px] border border-border bg-background px-3 text-xs font-semibold text-foreground">
                  {isAutomatic ? "Automático" : "Manual"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <h2 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-secondary">
                Líneas del asiento
              </h2>

              <button
                type="button"
                onClick={addLine}
                disabled={!canEdit}
                className="h-8 rounded-[5px] border border-border bg-surface px-3 text-xs font-semibold text-secondary transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                + Agregar línea
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-[5px] border border-border">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="sticky top-0 z-10 bg-background text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="w-[55px] border-b border-border px-2 py-2 text-center">
                      #
                    </th>

                    <th className="w-[70px] border-b border-border px-2 py-2 text-center">
                      Orden
                    </th>

                    <th className="border-b border-border px-2 py-2 text-left">
                      Cuenta
                    </th>

                    <th className="w-[150px] border-b border-border px-2 py-2 text-left">
                      Descripción
                    </th>

                    <th className="w-[115px] border-b border-border px-2 py-2 text-right">
                      Debe
                    </th>

                    <th className="w-[115px] border-b border-border px-2 py-2 text-right">
                      Haber
                    </th>

                    <th className="w-[80px] border-b border-border px-2 py-2 text-center">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {lines.map((line, index) => (
                    <tr
                      key={line.clientId}
                      draggable={canEdit}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      className={`border-b border-border bg-surface text-xs text-foreground transition hover:bg-background ${
                        draggedIndex === index ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-2 py-2 text-center font-extrabold text-secondary">
                        {index + 1}
                      </td>

                      <td className="px-2 py-2 text-center">
                        <span className="cursor-grab rounded-[5px] border border-border px-2 py-1 text-[10px] text-muted-foreground">
                          ⋮⋮
                        </span>
                      </td>

                      <td className="px-2 py-2">
                        <select
                          value={line.accountId}
                          onChange={(event) =>
                            updateLine(line.clientId, {
                              accountId: event.target.value,
                            })
                          }
                          disabled={!canEdit}
                          className={inputBaseClass}
                        >
                          <option value="">Seleccionar cuenta</option>

                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {"— ".repeat(account.depth)}
                              {account.accountNumber} · {account.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-2 py-2">
                        <input
                          value={line.lineDescription}
                          onChange={(event) =>
                            updateLine(line.clientId, {
                              lineDescription: event.target.value,
                            })
                          }
                          disabled={!canEdit}
                          placeholder="Detalle"
                          className={inputBaseClass}
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.isDebit ? line.amount : ""}
                          onChange={(event) =>
                            updateLine(line.clientId, {
                              amount: event.target.value,
                              isDebit: true,
                            })
                          }
                          disabled={!canEdit}
                          placeholder="0"
                          className={`${inputBaseClass} text-right`}
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={!line.isDebit ? line.amount : ""}
                          onChange={(event) =>
                            updateLine(line.clientId, {
                              amount: event.target.value,
                              isDebit: false,
                            })
                          }
                          disabled={!canEdit}
                          placeholder="0"
                          className={`${inputBaseClass} text-right`}
                        />
                      </td>

                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.clientId)}
                          disabled={!canEdit || lines.length <= 2}
                          className="rounded-[5px] border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Summary */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <div className="rounded-[5px] border border-border bg-surface p-4 shadow-panel">
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-secondary">
              Estado del asiento
            </h2>

            <div
              className={`mt-3 rounded-[5px] px-3 py-2 text-xs font-extrabold ${
                isBalanced
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {isBalanced ? "Asiento balanceado" : "Asiento descuadrado"}
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Debe</span>
                <span className="font-extrabold text-foreground">
                  {formatMoney(debitTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Haber</span>
                <span className="font-extrabold text-foreground">
                  {formatMoney(creditTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">Diferencia</span>
                <span
                  className={`font-extrabold ${
                    isBalanced ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatMoney(difference)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}