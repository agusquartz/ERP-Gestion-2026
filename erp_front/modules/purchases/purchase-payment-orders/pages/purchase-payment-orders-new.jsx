
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getSuppliers } from "@/lib/http/client/supplier";
import { fetchPurchaseInvoices } from "@/lib/http/client/purchase-invoices";



// Helper: format currency
function formatMoney(value) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getInvoicePendingAmount(invoice) {
  return Number(invoice.total || 0) - Number(invoice.totalPaid || 0);
}

// Helper: format date for display
function formatDate(dateString) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("es-PY", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function PlusIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
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
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
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
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

// ---------- Main Page Component ----------
export default function NewPaymentOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Supplier modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [supplierError, setSupplierError] = useState("");

  // Invoice modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);

  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  // Load suppliers from API when supplier modal opens or search changes.
  useEffect(() => {
    if (!isSupplierModalOpen) return;

    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      try {
        setIsLoadingSuppliers(true);
        setSupplierError("");

        const result = await getSuppliers({
          contains: supplierSearch,
        });

        if (!cancelled) {
          setSuppliers(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        if (!cancelled) {
          setSupplierError(
            error.message || "No se pudieron cargar los proveedores."
          );
          setSuppliers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSuppliers(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isSupplierModalOpen, supplierSearch]);

  useEffect(() => {
    if (!isInvoiceModalOpen || !selectedSupplier) return;

    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      try {
        setIsLoadingInvoices(true);
        setInvoiceError("");

        const response = await fetchPurchaseInvoices({
          // Backend searches by invoice number OR supplier name.
          // Since there is no supplierId filter yet, we use supplier name here.
          search: selectedSupplier.name,
          status: "payment_pending",
          since: dateFrom || undefined,
          to: dateTo || undefined,
          limit: 100,
        });

        const rows = Array.isArray(response?.data) ? response.data : [];

        if (!cancelled) {
          setPurchaseInvoices(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setInvoiceError(
            err.message || "No se pudieron cargar las facturas del proveedor."
          );
          setPurchaseInvoices([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingInvoices(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isInvoiceModalOpen, selectedSupplier, dateFrom, dateTo]);

  const openSupplierModal = () => {
    setSupplierSearch("");
    setIsSupplierModalOpen(true);
  };

  const closeSupplierModal = () => {
    setIsSupplierModalOpen(false);
  };

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);

    // If supplier changes, old selected invoices should not remain selected.
    setSelectedInvoiceIds([]);

    // Also clear old invoices loaded from the previous supplier.
    setPurchaseInvoices([]);
    setInvoiceError("");

    closeSupplierModal();
  };

  // Get invoices for selected supplier.
  const supplierInvoices = useMemo(() => {
    if (!selectedSupplier) return [];

    return purchaseInvoices.filter((invoice) => {
      const belongsToSupplier = invoice.supplier?.id === selectedSupplier.id;
      const isPending = invoice.paymentStatus === "payment_pending";

      return belongsToSupplier && isPending;
    });
  }, [purchaseInvoices, selectedSupplier]);

  // Filter invoices inside modal by invoice number and date range.
  const filteredInvoices = useMemo(() => {
    let invoices = supplierInvoices;

    if (invoiceSearch.trim()) {
      const lower = invoiceSearch.toLowerCase();

      invoices = invoices.filter((invoice) =>
        invoice.invoiceNr?.toLowerCase().includes(lower)
      );
    }

    return invoices;
  }, [supplierInvoices, invoiceSearch]);

  // Toggle selection of an invoice.
  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  // Select / deselect all visible invoices.
  const toggleSelectAll = () => {
    const visibleIds = filteredInvoices.map((invoice) => invoice.id);

    const allSelected = visibleIds.every((id) =>
      selectedInvoiceIds.includes(id)
    );

    if (allSelected) {
      setSelectedInvoiceIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
      return;
    }

    setSelectedInvoiceIds((prev) => {
      const newIds = [...prev];

      visibleIds.forEach((id) => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });

      return newIds;
    });
  };

  const isAllSelected =
    filteredInvoices.length > 0 &&
    filteredInvoices.every((invoice) =>
      selectedInvoiceIds.includes(invoice.id)
    );

  const isSomeSelected = filteredInvoices.some((invoice) =>
    selectedInvoiceIds.includes(invoice.id)
  );

  // Calculate totals for selected invoices.
  const selectedInvoices = useMemo(() => {
    if (!selectedSupplier) return [];

    return purchaseInvoices.filter(
      (invoice) =>
        invoice.supplier?.id === selectedSupplier.id &&
        invoice.paymentStatus === "payment_pending" &&
        selectedInvoiceIds.includes(invoice.id)
    );
  }, [purchaseInvoices, selectedInvoiceIds, selectedSupplier]);

  const totalSelectedAmount = selectedInvoices.reduce(
    (sum, invoice) => sum + getInvoicePendingAmount(invoice),
    0
  );

  const totalSelectedCount = selectedInvoices.length;

  const openInvoiceModal = () => {
    if (!selectedSupplier) {
      alert("Por favor selecciona un proveedor primero.");
      return;
    }

    setInvoiceSearch("");
    setDateFrom("");
    setDateTo("");
    setIsInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
  };

  const handleSaveInvoices = () => {
    console.log("Selected supplier:", selectedSupplier);
    console.log("Selected invoices:", selectedInvoices);

    alert(
      `Se han seleccionado ${totalSelectedCount} facturas por un total de ${formatMoney(
        totalSelectedAmount
      )}`
    );

    closeInvoiceModal();
  };

  const removeInvoice = (invoiceId) => {
  setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceId));
};

const handleCancel = () => {
  setSelectedSupplier(null);
  setSelectedInvoiceIds([]);

  setInvoiceSearch("");
  setDateFrom("");
  setDateTo("");

  setSupplierSearch("");
  setSupplierError("");
  setSuppliers([]);

  setPurchaseInvoices([]);
  setInvoiceError("");

  setError("");

  setIsSupplierModalOpen(false);
  setIsInvoiceModalOpen(false);
};

const handleConfirmPaymentOrder = async () => {
  if (!selectedSupplier) {
    setError("Debe seleccionar un proveedor.");
    return;
  }

  if (selectedInvoices.length === 0) {
    setError("Debe agregar al menos una factura.");
    return;
  }

  try {
    setIsSubmitting(true);
    setError("");

    const payload = {
      supplierId: selectedSupplier.id,
      details: selectedInvoices.map((invoice) => ({
        purchaseInvoiceId: invoice.id,
        amountToPay: String(getInvoicePendingAmount(invoice)),
        observations: `Pago de factura ${invoice.invoiceNr}`,
      })),
    };

    console.log("Payment order payload:", payload);

    // Later, when you create the API:
    // await createPurchasePaymentOrder(payload);

    alert(
      `Orden de pago confirmada para ${selectedSupplier.name} por ${formatMoney(
        totalSelectedAmount
      )}`
    );

    router.push("/purchase-payment-orders");
  } catch (err) {
    setError(err.message || "No se pudo confirmar la orden de pago.");
  } finally {
    setIsSubmitting(false);
  }
};

  const totalAmount = totalSelectedAmount;
  return (
    <div className="flex h-full min-h-0 flex-col rounded-[5px] bg-surface p-4 md:p-6">
      {/* Title */}
      <div className="mb-5">
        <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[42px]">
          Nueva Orden de Pago
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Seleccione un proveedor y las facturas a pagar
        </p>

        <div className="mt-2 h-px w-full bg-foreground/80" />
      </div>

      {/* Supplier Search Section */}
      <div className="mb-6 rounded-[5px] border border-border bg-surface p-4 shadow-panel">
        <label className="mb-1 block text-xs font-semibold text-secondary">
          Proveedor
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={openSupplierModal}
            className="w-full rounded-[5px] border border-border bg-background px-3.5 py-2.5 text-left text-sm text-foreground outline-none transition-all duration-200 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            {selectedSupplier ? (
              <span>{selectedSupplier.name}</span>
            ) : (
              <span className="text-muted-foreground">Buscar y seleccionar proveedor...</span>
            )}
          </button>

          <button
            type="button"
            onClick={openSupplierModal}
            className="rounded-[5px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover active:translate-y-px"
          >
            Buscar
          </button>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={openInvoiceModal}
            disabled={!selectedSupplier}
            className="rounded-[5px] bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            Seleccionar Facturas
          </button>
        </div>
      </div>

      {/* Invoices + Payment Order Detail */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_328px]">
        <section className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-[39px] flex-1 items-center rounded-[5px] border border-[#8dadff] bg-[#eef4ff] px-6 text-[15px] font-bold text-slate-600">
              <InfoIcon className="mr-3 h-6 w-6 text-slate-600" />
              {selectedSupplier
                ? `Solo se muestran facturas de ${selectedSupplier.name}.`
                : "Seleccione un proveedor para agregar facturas."}
            </div>

            <button
              type="button"
              onClick={openInvoiceModal}
              disabled={!selectedSupplier}
              className="inline-flex h-[37px] items-center gap-3 rounded-[5px] bg-primary px-4 text-[12px] font-extrabold text-primary-foreground shadow-sm transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar factura
            </button>
          </div>

          <div className="flex h-[440px] flex-col overflow-hidden rounded-[5px] border border-border bg-surface shadow-panel">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="h-[28px] bg-[#ededf1] text-[12px] font-extrabold text-black shadow-[0_2px_5px_rgba(0,0,0,0.25)]">
                    <th className="w-[52px] px-3 text-center">#</th>
                    <th className="px-3 text-left">Nro Factura</th>
                    <th className="px-3 text-left">Fecha</th>
                    <th className="px-3 text-left">Monto Total</th>
                    <th className="px-3 text-center">Estado</th>
                    <th className="w-[150px] px-3 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedInvoices.map((invoice, index) => (
                    <tr
                      key={invoice.id}
                      className={`h-[33px] text-[12px] text-black ${
                        index % 2 === 1 ? "bg-[#f0f0f4]" : "bg-white"
                      }`}
                    >
                      <td className="px-3 text-center">{index + 1}</td>

                      <td className="px-3 font-medium">{invoice.invoiceNr}</td>

                      <td className="px-3">{formatDate(invoice.createdAt)}</td>

                      <td className="px-3">{formatMoney(getInvoicePendingAmount(invoice))}</td>

                      <td className="px-3 text-center">
                        <span className="inline-flex items-center gap-2 rounded-[5px] border border-red-500 bg-red-50 px-3 py-0.5 text-[12px] font-bold text-red-900">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-900" />
                          Pendiente
                        </span>
                      </td>

                      <td className="px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeInvoice(invoice.id)}
                          className="inline-flex rounded-md p-1.5 text-black transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Quitar factura"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {selectedInvoices.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-sm font-medium text-muted-foreground"
                      >
                        No hay facturas agregadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-1 pl-2 text-[13px] font-bold text-muted-foreground">
            total facturas: {selectedInvoices.length}
          </p>

          {error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
        </section>

        <aside className="rounded-[5px] border border-border bg-surface p-4 shadow-panel">
          <h3 className="mb-3 text-base font-bold text-foreground">
            Estado de Orden de Pago
          </h3>

          <div className="flex flex-col gap-4">
            <div className="rounded-[5px] bg-background p-3 text-center">
              <div className="text-xs font-semibold text-secondary">Total</div>
              <div className="text-xl font-bold text-foreground">
                {formatMoney(totalAmount)}
              </div>
            </div>

            <div className="rounded-[5px] bg-background p-3 text-center">
              <div className="text-xs font-semibold text-secondary">
                Total Facturas
              </div>
              <div className="text-xl font-bold text-foreground">
                {selectedInvoices.length}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Supplier Search Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[5px] bg-surface shadow-xl">
            {/* Modal Header */}
            <div className="border-b border-border bg-surface px-6 py-4">
              <h2 className="text-2xl font-bold text-foreground">
                Seleccionar Proveedor
              </h2>

              <p className="text-sm text-muted-foreground">
                Busque un proveedor por nombre, email o dirección.
              </p>
            </div>

            {/* Search */}
            <div className="border-b border-border p-4">
              <label className="mb-1 block text-xs font-semibold text-secondary">
                Buscar proveedor
              </label>

              <input
                type="text"
                value={supplierSearch}
                onChange={(event) => setSupplierSearch(event.target.value)}
                placeholder="Ej: Michelin, Neumáticos, ventas@..."
                autoFocus
                className="w-full rounded-[5px] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            {/* Supplier Results */}
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {supplierError && (
                <div className="mb-3 rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {supplierError}
                </div>
              )}

              {isLoadingSuppliers ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Cargando proveedores...
                </div>
              ) : suppliers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                        <th className="px-2 py-2">Proveedor</th>
                        <th className="px-2 py-2">Email</th>
                        <th className="px-2 py-2">Categorías</th>
                        <th className="px-2 py-2 text-right">Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {suppliers.map((supplier) => {
                        const isSelected = selectedSupplier?.id === supplier.id;

                        return (
                          <tr
                            key={supplier.id}
                            className="border-b border-border text-sm text-foreground"
                          >
                            <td className="px-2 py-2">
                              <div className="font-medium">{supplier.name}</div>

                              <div className="text-xs text-muted-foreground">
                                {supplier.address || "Sin dirección"}
                              </div>
                            </td>

                            <td className="px-2 py-2">{supplier.email}</td>

                            <td className="px-2 py-2">
                              {supplier.categories?.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {supplier.categories.map((category) => (
                                    <span
                                      key={category.id}
                                      className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-secondary"
                                    >
                                      {category.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Sin categorías
                                </span>
                              )}
                            </td>

                            <td className="px-2 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleSelectSupplier(supplier)}
                                className="rounded-[5px] bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover active:translate-y-px"
                              >
                                {isSelected ? "Seleccionado" : "Seleccionar"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No se encontraron proveedores.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-border bg-surface px-6 py-4">
              <button
                type="button"
                onClick={closeSupplierModal}
                className="rounded-[5px] border border-border px-5 py-2 text-sm font-semibold text-secondary transition hover:bg-background"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-end gap-6">
      <button
        type="button"
        onClick={handleCancel}
        className="cursor-pointer min-w-[200px] rounded-[5px] border border-border px-5 py-2.5 text-sm font-semibold text-secondary transition hover:bg-background duration-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
        Cancelar
      </button>
      

      <button
        type="button"
        onClick={handleConfirmPaymentOrder}
        disabled={isSubmitting || !selectedSupplier || selectedInvoices.length === 0}
        className="h-[42px] w-[300px] rounded-[6px] bg-primary text-[18px] font-extrabold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
      >
        {isSubmitting ? "Confirmando..." : "Confirmar Orden de Pago"}
      </button>
    </div>

      {/* Modal: Seleccionar Facturas */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[5px] bg-surface shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4">
              <h2 className="text-2xl font-bold text-foreground">
                Seleccionar Facturas
              </h2>

              {selectedSupplier && (
                <p className="text-sm text-muted-foreground">
                  Proveedor:{" "}
                  <span className="font-medium">{selectedSupplier.name}</span>
                </p>
              )}
            </div>

            {/* Filters */}
            <div className="border-b border-border p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-secondary">
                    Nro Factura
                  </label>

                  <input
                    type="text"
                    value={invoiceSearch}
                    onChange={(event) => setInvoiceSearch(event.target.value)}
                    placeholder="Buscar por número..."
                    className="w-full rounded-[5px] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-secondary">
                    Fecha desde
                  </label>

                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="w-full rounded-[5px] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-secondary">
                    Fecha hasta
                  </label>

                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="w-full rounded-[5px] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto p-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                    <th className="w-10 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate =
                              isSomeSelected && !isAllSelected;
                          }
                        }}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </th>

                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">Factura</th>
                    <th className="px-2 py-2">Fecha</th>
                    <th className="px-2 py-2 text-right">Monto</th>
                    <th className="px-2 py-2">Proveedor</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoadingInvoices && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Cargando facturas...
                    </td>
                  </tr>
                )}

                {invoiceError && !isLoadingInvoices && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-red-600"
                    >
                      {invoiceError}
                    </td>
                  </tr>
                )}
                  {!isLoadingInvoices &&
                    !invoiceError &&
                    filteredInvoices.map((invoice, index) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border text-sm text-foreground"
                    >
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedInvoiceIds.includes(invoice.id)}
                          onChange={() => toggleInvoiceSelection(invoice.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </td>

                      <td className="px-2 py-2">{index + 1}</td>

                      <td className="px-2 py-2 font-medium">
                        {invoice.invoiceNr}
                      </td>

                      <td className="px-2 py-2">{formatDate(invoice.createdAt)}</td>

                      <td className="px-2 py-2 text-right">
                        {formatMoney(getInvoicePendingAmount(invoice))}
                      </td>

                      <td className="px-2 py-2">
                        {selectedSupplier?.name || "-"}
                      </td>
                    </tr>
                  ))}

                  {!isLoadingInvoices && !invoiceError && filteredInvoices.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No hay facturas que coincidan con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-surface px-6 py-4">
              <button
                type="button"
                onClick={closeInvoiceModal}
                className="rounded-[5px] border border-border px-5 py-2 text-sm font-semibold text-secondary transition hover:bg-background"
              >
                Atrás
              </button>

              <button
                type="button"
                onClick={handleSaveInvoices}
                disabled={selectedInvoices.length === 0}
                className="rounded-[5px] bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}