"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAccountingProcesses,
  getChartOfAccounts,
  createJournalEntry,
} from "@/lib/http/client/accounting";

const inputBaseClass =
  "w-full rounded-[5px] border border-border bg-background px-3 py-2 text-xs text-foreground outline-none transition-all duration-200 " +
  "placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15";

function makeLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyLine() {
  return {
    localId: makeLocalId(),
    accountId: "",
    lineDescription: "",
    debit: "",
    credit: "",
  };
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLatestProcess(processes = []) {
  if (!processes.length) return null;

  return [...processes].sort(
    (a, b) => Number(b.fiscalYear || 0) - Number(a.fiscalYear || 0)
  )[0];
}

function flattenAccountsTree(nodes = [], depth = 0) {
  const rows = [];

  for (const node of nodes) {
    rows.push({
      ...node,
      depth,
    });

    rows.push(...flattenAccountsTree(node.children || [], depth + 1));
  }

  return rows;
}

function StatusBadge({ balanced }) {
  return (
    <span
      className={`inline-flex items-center rounded-[5px] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
        balanced
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {balanced ? "Asiento balanceado" : "Asiento descuadrado"}
    </span>
  );
}

function DragIcon({ className = "" }) {
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
      <path d="M9 5h.01" />
      <path d="M9 12h.01" />
      <path d="M9 19h.01" />
      <path d="M15 5h.01" />
      <path d="M15 12h.01" />
      <path d="M15 19h.01" />
    </svg>
  );
}

function TrashIcon({ className = "" }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

export default function NewJournalEntryPage() {
  const router = useRouter();

  const [processes, setProcesses] = useState([]);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const [entryNumber, setEntryNumber] = useState("");
  const [entryDate, setEntryDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");

  const [lines, setLines] = useState(() => [createEmptyLine(), createEmptyLine()]);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadAccounts() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const processData = await getAccountingProcesses();
        const latestProcess = getLatestProcess(processData || []);

        if (!latestProcess) {
          if (!ignore) {
            setProcesses([]);
            setCurrentProcess(null);
            setAccounts([]);
          }

          return;
        }

        const accountTree = await getChartOfAccounts({
          accountingProcessId: latestProcess.id,
          tree: true,
        });

        const flatAccounts = flattenAccountsTree(accountTree || []);

        if (!ignore) {
          setProcesses(processData || []);
          setCurrentProcess(latestProcess);
          setAccounts(flatAccounts);
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

    loadAccounts();

    return () => {
      ignore = true;
    };
  }, []);

  const postableAccounts = useMemo(() => {
    return accounts.filter((account) => account.isPostable);
  }, [accounts]);

  const totals = useMemo(() => {
    const debitTotal = lines.reduce(
      (sum, line) => sum + normalizeNumber(line.debit),
      0
    );

    const creditTotal = lines.reduce(
      (sum, line) => sum + normalizeNumber(line.credit),
      0
    );

    const difference = debitTotal - creditTotal;

    return {
      debitTotal,
      creditTotal,
      difference,
      balanced: Math.abs(difference) < 0.01 && debitTotal > 0,
    };
  }, [lines]);

  const updateLine = (localId, field, value) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.localId !== localId) return line;

        if (field === "debit") {
          return {
            ...line,
            debit: value,
            credit: value ? "" : line.credit,
          };
        }

        if (field === "credit") {
          return {
            ...line,
            credit: value,
            debit: value ? "" : line.debit,
          };
        }

        return {
          ...line,
          [field]: value,
        };
      })
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const removeLine = (localId) => {
    setLines((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((line) => line.localId !== localId);
    });
  };

  const moveLine = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;

    setLines((prev) => {
      const fromIndex = prev.findIndex((line) => line.localId === fromId);
      const toIndex = prev.findIndex((line) => line.localId === toId);

      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      return next;
    });
  };

  const handleDragStart = (event, localId) => {
    setDraggingId(localId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", localId);
  };

  const handleDragOver = (event, localId) => {
    event.preventDefault();
    setDragOverId(localId);
  };

  const handleDrop = (event, targetId) => {
    event.preventDefault();

    const sourceId =
      event.dataTransfer.getData("text/plain") || draggingId;

    moveLine(sourceId, targetId);

    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const buildPayload = () => {
    const usableLines = lines.filter((line) => {
      return (
        line.accountId ||
        line.lineDescription.trim() ||
        normalizeNumber(line.debit) > 0 ||
        normalizeNumber(line.credit) > 0
      );
    });

    const details = usableLines.map((line, index) => {
      const debit = normalizeNumber(line.debit);
      const credit = normalizeNumber(line.credit);
      const isDebit = debit > 0;
      const amount = isDebit ? debit : credit;

      return {
        accountId: Number(line.accountId),
        amount: amount.toFixed(2),
        isDebit,
        lineNumber: index + 1,
        lineDescription: line.lineDescription.trim() || null,
      };
    });

    return {
      entryNumber: Number(entryNumber),
      entryDate,
      description: description.trim() || null,
      isAutomatic: false,
      details,
    };
  };

  const validatePayload = () => {
    if (!entryNumber || Number(entryNumber) <= 0) {
      return "El número de asiento debe ser mayor a cero.";
    }

    if (!entryDate) {
      return "La fecha del asiento es obligatoria.";
    }

    const usableLines = lines.filter((line) => {
      return (
        line.accountId ||
        line.lineDescription.trim() ||
        normalizeNumber(line.debit) > 0 ||
        normalizeNumber(line.credit) > 0
      );
    });

    if (usableLines.length < 2) {
      return "El asiento debe tener al menos dos líneas.";
    }

    for (let index = 0; index < usableLines.length; index += 1) {
      const line = usableLines[index];
      const debit = normalizeNumber(line.debit);
      const credit = normalizeNumber(line.credit);

      if (!line.accountId) {
        return `La línea ${index + 1} no tiene una cuenta seleccionada.`;
      }

      if (debit <= 0 && credit <= 0) {
        return `La línea ${index + 1} debe tener un monto en Debe o Haber.`;
      }

      if (debit > 0 && credit > 0) {
        return `La línea ${index + 1} no puede tener monto en Debe y Haber al mismo tiempo.`;
      }
    }

    if (!totals.balanced) {
      return "El asiento debe estar balanceado antes de registrarse.";
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validatePayload();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = buildPayload();
      await createJournalEntry(payload);

      router.push("/accounting/entries");
      router.refresh();
    } catch (error) {
      setErrorMessage(error.message || "No se pudo registrar el asiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 md:p-4">
      {/* Header */}
      <div className="mb-3 flex shrink-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold leading-none tracking-tight text-foreground md:text-[34px]">
            Nuevo Asiento Contable
          </h1>

          <p className="mt-1.5 max-w-3xl text-xs text-muted-foreground">
            Cargá un asiento manual balanceado. Los asientos automáticos son
            generados por el sistema y no se editan desde esta pantalla.
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
            disabled
            className="h-8 rounded-[5px] border border-border bg-muted/15 px-3 text-xs font-semibold text-muted-foreground opacity-70"
            title="La base de datos actual no tiene estado de borrador"
          >
            Guardar borrador
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-8 rounded-[5px] bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Registrando..." : "Registrar asiento"}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main editor */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
          <div className="shrink-0 border-b border-border p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[130px_150px_1fr_160px]">
              <div>
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-secondary">
                  Número
                </label>

                <input
                  type="number"
                  min="1"
                  value={entryNumber}
                  onChange={(event) => setEntryNumber(event.target.value)}
                  placeholder="Ej: 42"
                  className={inputBaseClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-secondary">
                  Fecha
                </label>

                <input
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                  className={inputBaseClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-secondary">
                  Referencia interna
                </label>

                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Referencia opcional"
                  className={inputBaseClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-secondary">
                  Tipo
                </label>

                <div className="flex h-[34px] items-center justify-between rounded-[5px] border border-border bg-background px-3">
                  <span className="text-xs font-semibold text-foreground">
                    Manual
                  </span>

                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-extrabold uppercase text-success">
                    Editable
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-secondary">
                Descripción general
              </label>

              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describí el motivo del asiento contable..."
                className={inputBaseClass}
              />
            </div>

            {isLoading && (
              <div className="mt-3 rounded-[5px] border border-border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                Cargando cuentas contables...
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 rounded-[5px] border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Lines table */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="sticky top-0 z-10 bg-background text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="w-[52px] border-b border-border px-2 py-2 text-center">
                      #
                    </th>

                    <th className="w-[250px] border-b border-border px-2 py-2 text-left">
                      Cuenta
                    </th>

                    <th className="border-b border-border px-2 py-2 text-left">
                      Descripción
                    </th>

                    <th className="w-[120px] border-b border-border px-2 py-2 text-right">
                      Debe
                    </th>

                    <th className="w-[120px] border-b border-border px-2 py-2 text-right">
                      Haber
                    </th>

                    <th className="w-[62px] border-b border-border px-2 py-2 text-center">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {lines.map((line, index) => {
                    const isDragging = draggingId === line.localId;
                    const isDragOver = dragOverId === line.localId;

                    return (
                      <tr
                        key={line.localId}
                        onDragOver={(event) =>
                          handleDragOver(event, line.localId)
                        }
                        onDrop={(event) => handleDrop(event, line.localId)}
                        className={`border-b border-border text-xs text-foreground transition ${
                          isDragging
                            ? "bg-primary/10 opacity-60"
                            : isDragOver
                              ? "bg-primary/5"
                              : "bg-surface hover:bg-background"
                        }`}
                      >
                        <td className="px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              draggable
                              onDragStart={(event) =>
                                handleDragStart(event, line.localId)
                              }
                              onDragEnd={handleDragEnd}
                              className="cursor-grab rounded-[5px] p-1 text-muted-foreground transition hover:bg-primary/10 hover:text-primary active:cursor-grabbing"
                              title="Arrastrar para reordenar"
                            >
                              <DragIcon className="h-4 w-4" />
                            </button>

                            <span className="font-extrabold text-secondary">
                              {index + 1}
                            </span>
                          </div>
                        </td>

                        <td className="px-2 py-2">
                          <select
                            value={line.accountId}
                            onChange={(event) =>
                              updateLine(
                                line.localId,
                                "accountId",
                                event.target.value
                              )
                            }
                            className={inputBaseClass}
                          >
                            <option value="">Seleccionar cuenta</option>

                            {postableAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.accountNumber} · {account.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-2 py-2">
                          <input
                            value={line.lineDescription}
                            onChange={(event) =>
                              updateLine(
                                line.localId,
                                "lineDescription",
                                event.target.value
                              )
                            }
                            placeholder="Descripción de la línea"
                            className={inputBaseClass}
                          />
                        </td>

                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.debit}
                            onChange={(event) =>
                              updateLine(line.localId, "debit", event.target.value)
                            }
                            placeholder="0.00"
                            className={`${inputBaseClass} text-right`}
                          />
                        </td>

                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.credit}
                            onChange={(event) =>
                              updateLine(
                                line.localId,
                                "credit",
                                event.target.value
                              )
                            }
                            placeholder="0.00"
                            className={`${inputBaseClass} text-right`}
                          />
                        </td>

                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(line.localId)}
                            disabled={lines.length <= 2}
                            className="rounded-[5px] p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                            title="Eliminar línea"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {lines.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-xs text-muted-foreground"
                      >
                        No hay líneas cargadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="shrink-0 border-t border-border p-3">
              <button
                type="button"
                onClick={addLine}
                className="h-8 rounded-[5px] border border-border bg-surface px-3 text-xs font-semibold text-secondary transition hover:bg-background"
              >
                + Agregar línea
              </button>
            </div>
          </div>
        </section>

        {/* Right summary */}
        <aside className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="rounded-[5px] border border-border bg-surface p-4 shadow-panel">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-secondary">
              Resumen del asiento
            </h2>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Proceso contable
                </span>

                <span className="text-xs font-extrabold text-foreground">
                  {currentProcess
                    ? `Ejercicio ${currentProcess.fiscalYear}`
                    : "No disponible"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Líneas cargadas
                </span>

                <span className="text-xs font-extrabold text-foreground">
                  {lines.length}
                </span>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                  Total debe
                </p>

                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {formatMoney(totals.debitTotal)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                  Total haber
                </p>

                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {formatMoney(totals.creditTotal)}
                </p>
              </div>

              <div
                className={`rounded-[5px] px-3 py-3 ${
                  totals.balanced ? "bg-success/10" : "bg-destructive/10"
                }`}
              >
                <p
                  className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${
                    totals.balanced ? "text-success" : "text-destructive"
                  }`}
                >
                  Diferencia
                </p>

                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {formatMoney(totals.difference)}
                </p>
              </div>

              <StatusBadge balanced={totals.balanced} />
            </div>
          </div>

          <div className="rounded-[5px] border border-border bg-background p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-secondary">
              Regla importante
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              El número visible de cada línea se recalcula según el orden actual
              de la tabla. Al arrastrar una línea, cambia su posición y también
              su número de línea contable.
            </p>
          </div>

          <div className="rounded-[5px] border border-border bg-surface p-4 shadow-panel">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-secondary">
              Auditoría
            </h3>

            <div className="mt-3 space-y-3 text-xs text-muted-foreground">
              <div>
                <p className="font-extrabold text-foreground">
                  Asiento manual
                </p>
                <p>Creado por usuario desde el módulo contable.</p>
              </div>

              <div>
                <p className="font-extrabold text-foreground">
                  Asiento automático
                </p>
                <p>
                  Reservado para compras, ventas, nómina y otros procesos del
                  sistema.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}