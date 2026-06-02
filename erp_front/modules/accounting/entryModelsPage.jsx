"use client";

import { useEffect, useMemo, useState } from "react";
import { getEntryModels } from "@/lib/http/client/accounting";

const inputBaseClass =
  "w-full rounded-[5px] border border-border bg-background px-3 py-2 text-xs text-foreground outline-none transition-all duration-200 " +
  "placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15";

function TemplateIcon({ className = "" }) {
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
      <path d="M4 4h16v5H4z" />
      <path d="M4 13h7v7H4z" />
      <path d="M15 13h5v7h-5z" />
    </svg>
  );
}

function FormulaIcon({ className = "" }) {
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
      <path d="M4 6h11" />
      <path d="M4 12h7" />
      <path d="M4 18h5" />
      <path d="M18 8l-4 8" />
      <path d="M14 8l4 8" />
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

function ToggleIcon({ active }) {
  return (
    <span
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
        active ? "bg-primary" : "bg-muted/30"
      }`}
    >
      <span
        className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-surface text-[9px] font-extrabold transition ${
          active ? "translate-x-4 text-primary" : "translate-x-0.5 text-muted"
        }`}
      >
        ✓
      </span>
    </span>
  );
}

function EntryTypeBadge({ type }) {
  const normalized = normalizeEntryType(type);

  return (
    <span
      className={`inline-flex min-w-[70px] items-center justify-center rounded-[5px] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
        normalized === "Detalle"
          ? "bg-primary/10 text-primary"
          : "bg-muted/15 text-muted-foreground"
      }`}
    >
      {normalized}
    </span>
  );
}

function DebitCreditBadge({ isDebit }) {
  return (
    <span className="inline-flex overflow-hidden rounded-[5px] bg-muted/15 p-0.5 text-[9px] font-extrabold uppercase tracking-wide">
      <span
        className={`rounded-[4px] px-1.5 py-0.5 ${
          isDebit ? "bg-surface text-primary shadow-panel" : "text-muted-foreground"
        }`}
      >
        Debe
      </span>
      <span
        className={`rounded-[4px] px-1.5 py-0.5 ${
          !isDebit ? "bg-surface text-primary shadow-panel" : "text-muted-foreground"
        }`}
      >
        Haber
      </span>
    </span>
  );
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeEntryType(type) {
  const value = normalizeText(type);

  if (value === "detail") return "Detalle";
  if (value === "summary") return "Resumen";

  return type || "Detalle";
}

function translateModuleName(value) {
  const dictionary = {
    Purchases: "Compras",
    Sales: "Ventas",
    Payroll: "Nómina",
    Treasury: "Tesorería",
    "Manual Accounting": "Contabilidad manual",
  };

  return dictionary[value] || value || "Sin módulo";
}

function humanizeOperationType(value) {
  if (!value) return "-";

  const dictionary = {
    purchase_invoice: "Factura de compra",
    purchase_payment: "Pago a proveedor",
    purchase_return_credit_note: "Nota de crédito por devolución",
    sales_invoice: "Factura de venta",
    sales_collection: "Cobro de cliente",
    sales_credit_note: "Nota de crédito de venta",
    payroll_salary: "Liquidación de salario",
    payroll_payment: "Pago de salario",
    manual_general_entry: "Asiento manual general",
  };

  if (dictionary[value]) return dictionary[value];

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getModelDisplayName(model) {
  return humanizeOperationType(model.operationType) || `Modelo ${model.id}`;
}

function getModelCode(model) {
  return `MOD-${String(model.id || 0).padStart(3, "0")}`;
}

function normalizeModel(model) {
  const moduleName =
    model.module?.name ||
    model.moduleName ||
    model.module_name ||
    "Sin módulo";

  const details = model.details || model.entryModelDetails || [];

  return {
    id: model.id,
    moduleId: model.module?.id || model.moduleId || model.module_id || null,
    moduleName,
    autoGenerate: Boolean(model.autoGenerate ?? model.auto_generate),
    entryType: model.entryType || model.entry_type,
    operationType: model.operationType || model.operation_type,
    description: model.description || "",
    createdAt: model.createdAt || model.created_at,
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
        isDebit: Boolean(detail.isDebit ?? detail.is_debit),
        lineNumber: detail.lineNumber || detail.line_number || 0,
        lineDescription:
          detail.lineDescription ||
          detail.line_description ||
          "Sin descripción",
      };
    }),
    raw: model,
  };
}
export default function EntryModelsPage() {
  const [models, setModels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadEntryModels() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const data = await getEntryModels();
        const mapped = (data || []).map(normalizeModel);

        if (!ignore) {
          setModels(mapped);
          setSelectedId(mapped[0]?.id || null);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error.message || "No se pudieron cargar los modelos de asiento."
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadEntryModels();

    return () => {
      ignore = true;
    };
  }, []);

  const modules = useMemo(() => {
    const unique = new Map();

    for (const model of models) {
      unique.set(model.moduleName, {
        name: model.moduleName,
        count: (unique.get(model.moduleName)?.count || 0) + 1,
      });
    }

    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (moduleFilter !== "all" && model.moduleName !== moduleFilter) {
        return false;
      }

      if (search.trim()) {
        const q = normalizeText(search);

        const matches =
          normalizeText(model.id).includes(q) ||
          normalizeText(model.moduleName).includes(q) ||
          normalizeText(model.operationType).includes(q) ||
          normalizeText(model.entryType).includes(q) ||
          normalizeText(model.description).includes(q) ||
          model.details.some(
            (detail) =>
              normalizeText(detail.accountNumber).includes(q) ||
              normalizeText(detail.accountName).includes(q) ||
              normalizeText(detail.lineDescription).includes(q)
          );

        if (!matches) return false;
      }

      return true;
    });
  }, [models, search, moduleFilter]);

  const selectedModel = useMemo(() => {
    return (
      models.find((model) => model.id === selectedId) ||
      filteredModels[0] ||
      models[0] ||
      null
    );
  }, [models, filteredModels, selectedId]);

  const clearFilters = () => {
    setSearch("");
    setModuleFilter("all");
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden rounded-[5px] bg-surface p-3 md:p-4">
      {/* Header */}
      <div className="mb-3 flex shrink-0 flex-col gap-3 overflow-hidden lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold leading-none tracking-tight text-foreground md:text-[34px]">
            Modelos de Asiento
          </h1>

          <p className="mt-1.5 max-w-3xl text-xs text-muted-foreground">
            Plantillas contables para generar asientos automáticos desde compras,
            ventas, nómina y procesos manuales.
          </p>

          <div className="mt-2 h-px w-full bg-foreground/80" />
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="h-8 rounded-[5px] border border-border bg-muted/15 px-3 text-xs font-semibold text-muted-foreground opacity-70"
            title="La importación de plantillas todavía no está disponible"
          >
            Importar
          </button>

          <button
            type="button"
            disabled
            className="h-8 rounded-[5px] bg-primary px-3 text-xs font-semibold text-primary-foreground opacity-50"
            title="La creación de modelos está desactivada por ahora"
          >
            + Nuevo
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Left library */}
        <aside className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[5px] border border-border bg-surface p-3 shadow-panel">
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <h2 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-secondary">
                Biblioteca activa
              </h2>

              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-extrabold text-primary">
                {models.length} modelos
              </span>
            </div>

            <div className="mb-3 shrink-0 space-y-2.5">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-secondary">
                  Buscar modelo
                </label>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Operación, módulo o cuenta..."
                  className={inputBaseClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-secondary">
                  Módulo
                </label>

                <select
                  value={moduleFilter}
                  onChange={(event) => setModuleFilter(event.target.value)}
                  className={inputBaseClass}
                >
                  <option value="all">Todos los módulos</option>
                  {modules.map((module) => (
                    <option key={module.name} value={module.name}>
                      {translateModuleName(module.name)}
                    </option>
                  ))}
                </select>
              </div>

              {(search || moduleFilter !== "all") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-8 w-full rounded-[5px] border border-border bg-surface text-xs font-semibold text-secondary transition hover:bg-background"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {isLoading && (
              <div className="mb-3 shrink-0 rounded-[5px] border border-border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                Cargando modelos...
              </div>
            )}

            {errorMessage && (
              <div className="mb-3 shrink-0 rounded-[5px] border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
              {filteredModels.map((model) => {
                const active = selectedModel?.id === model.id;

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedId(model.id)}
                    className={`w-full rounded-[5px] border p-3 text-left transition ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted/10"
                    }`}
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-foreground">
                          {getModelDisplayName(model)}
                        </p>

                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {translateModuleName(model.moduleName)}
                        </p>
                      </div>

                      <EntryTypeBadge type={model.entryType} />
                    </div>

                    <p className="line-clamp-2 text-[10px] italic leading-relaxed text-muted-foreground">
                      {model.description || "Sin descripción del modelo."}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                      <span>{model.details.length} líneas</span>
                      <span>{model.autoGenerate ? "Automático" : "Manual"}</span>
                    </div>
                  </button>
                );
              })}

              {filteredModels.length === 0 && (
                <div className="rounded-[5px] border border-border bg-background px-3 py-8 text-center text-xs text-muted-foreground">
                  No hay modelos disponibles.
                </div>
              )}
            </div>
          </div>

          <div className="hidden shrink-0 rounded-[5px] bg-secondary p-4 text-white shadow-panel xl:block">
            <h3 className="text-xs font-extrabold">Motor automático</h3>

            <p className="mt-1.5 text-[10px] leading-relaxed text-white/75">
              Base para generar asientos contables automáticos y balanceados.
            </p>

            <button
              type="button"
              disabled
              className="mt-3 h-8 rounded-[5px] bg-surface px-3 text-[10px] font-extrabold uppercase tracking-wide text-secondary opacity-80"
            >
              No disponible
            </button>
          </div>
        </aside>

        {/* Editor / Detail */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
          {selectedModel ? (
            <>
              <div className="shrink-0 border-b border-border p-4">
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">
                      Editor de plantilla
                    </h2>

                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Vista de consulta del modelo seleccionado.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-extrabold uppercase text-primary">
                      {humanizeOperationType(selectedModel.operationType)}
                    </span>

                    <span className="rounded-full bg-muted/15 px-2 py-0.5 text-[9px] font-extrabold uppercase text-muted-foreground">
                      ID: {getModelCode(selectedModel)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                      Modelo
                    </label>

                    <div className="flex h-9 items-center rounded-[5px] bg-primary/10 px-3 text-xs font-semibold text-foreground">
                      {getModelDisplayName(selectedModel)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                      Tipo de asiento
                    </label>

                    <div className="flex h-9 items-center rounded-[5px] bg-background px-3 text-xs font-semibold text-foreground">
                      {normalizeEntryType(selectedModel.entryType)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                      Módulo
                    </label>

                    <div className="flex h-9 items-center rounded-[5px] bg-background px-3 text-xs font-semibold text-foreground">
                      {translateModuleName(selectedModel.moduleName)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                      Operación
                    </label>

                    <div className="flex h-9 items-center rounded-[5px] bg-background px-3 text-xs font-semibold text-foreground">
                      {humanizeOperationType(selectedModel.operationType)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                      Auto-generar
                    </label>

                    <div className="flex h-9 items-center gap-2 rounded-[5px] bg-background px-3 text-xs font-semibold text-foreground">
                      <ToggleIcon active={selectedModel.autoGenerate} />
                      {selectedModel.autoGenerate ? "Activo" : "Manual"}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                      Líneas
                    </label>

                    <div className="flex h-9 items-center rounded-[5px] bg-background px-3 text-xs font-semibold text-foreground">
                      {selectedModel.details.length} líneas configuradas
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                    Descripción global
                  </label>

                  <div className="flex min-h-9 items-center gap-2 rounded-[5px] bg-primary/10 px-3 py-1.5 text-xs text-foreground">
                    <FormulaIcon className="h-3.5 w-3.5 shrink-0 text-secondary" />
                    <span className="line-clamp-2">
                      {selectedModel.description || "Sin descripción global."}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
                <div className="mb-2 flex shrink-0 items-center justify-between">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-secondary">
                    Detalle del modelo
                  </h3>

                  <button
                    type="button"
                    disabled
                    className="text-[10px] font-extrabold text-muted-foreground opacity-60"
                    title="La edición de líneas está desactivada"
                  >
                    + Agregar línea
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto rounded-[5px] border border-border">
                  <table className="w-full table-fixed border-collapse">
                    <thead>
                      <tr className="sticky top-0 z-10 bg-background text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                        <th className="w-[210px] border-b border-border px-3 py-2 text-left">
                          Plan de cuenta
                        </th>

                        <th className="w-[120px] border-b border-border px-3 py-2 text-center">
                          Debe / Haber
                        </th>

                        <th className="border-b border-border px-3 py-2 text-left">
                          Descripción
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedModel.details.map((detail) => (
                        <tr
                          key={`${selectedModel.id}-${detail.lineNumber}-${detail.accountId}`}
                          className="border-b border-border bg-surface text-xs text-foreground transition hover:bg-background"
                        >
                          <td className="px-3 py-2.5">
                            <p className="truncate font-extrabold text-secondary">
                              {detail.accountNumber}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                              {detail.accountName}
                            </p>
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            <DebitCreditBadge isDebit={detail.isDebit} />
                          </td>

                          <td className="px-3 py-2.5">
                            <p className="line-clamp-2 text-xs leading-relaxed text-foreground">
                              {detail.lineDescription}
                            </p>
                          </td>
                        </tr>
                      ))}

                      {selectedModel.details.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="py-10 text-center text-xs text-muted-foreground"
                          >
                            Este modelo no tiene líneas configuradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex shrink-0 justify-end gap-2">
                  <button
                    type="button"
                    disabled
                    className="h-8 rounded-[5px] border border-border bg-surface px-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-secondary opacity-60"
                  >
                    Descartar
                  </button>

                  <button
                    type="button"
                    disabled
                    className="h-8 rounded-[5px] bg-primary px-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary-foreground opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
              Seleccioná un modelo de asiento para ver sus detalles.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}