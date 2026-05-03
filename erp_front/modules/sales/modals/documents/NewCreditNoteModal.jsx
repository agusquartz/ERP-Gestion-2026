"use client";

/* ============================================================
   NEW CREDIT NOTE MODAL

   Modal used to create a new credit note from a selected invoice.
   It displays the invoice number, renders the invoice items table,
   and provides actions to cancel or generate the credit note.
   ============================================================ */

import { useEffect, useState } from "react";
import { NewCreditNoteTable } from "./NewCreditNoteTable";
import { ActionButton } from "../../components/documents/ButtonActions";
import { createCreditNote } from "@/lib/http/client/credit-notes";

function getTodayLocalDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function NewCreditNoteModal({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  items = [],
  onCreated,
}) {
  const [creditNoteNumber, setCreditNoteNumber] = useState("");
  const [creditNoteItems, setCreditNoteItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const normalizedItems = items.map((item) => ({
      ...item,
      selected: false,
      returnQty: 1,
      OriginalQty: Number(item.OriginalQty ?? item.quantity ?? 1),
      unitPrice: Number(item.unitPrice ?? item.unitCost ?? 0),
    }));

    setCreditNoteItems(normalizedItems);
    setCreditNoteNumber("");
    setErrorMessage("");
  }, [isOpen, items]);

  if (!isOpen) return null;

  const handleToggleItem = (itemId) => {
    setCreditNoteItems((prev) =>
      prev.map((item) => {
        const currentId = item.productId ?? item.code;

        if (currentId !== itemId) return item;

        return {
          ...item,
          selected: !item.selected,
        };
      })
    );
  };

  const handleToggleAll = () => {
    const allSelected =
      creditNoteItems.length > 0 &&
      creditNoteItems.every((item) => item.selected);

    setCreditNoteItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: !allSelected,
      }))
    );
  };

  const handleChangeQuantity = (itemId, value) => {
    setCreditNoteItems((prev) =>
      prev.map((item) => {
        const currentId = item.productId ?? item.code;

        if (currentId !== itemId) return item;

        const originalQty = Number(item.OriginalQty ?? item.quantity ?? 1);
        const numericValue = Number(value);

        const safeQty = Math.min(
          Math.max(numericValue || 1, 1),
          originalQty
        );

        return {
          ...item,
          returnQty: safeQty,
        };
      })
    );
  };

  const handleSubmit = async () => {
    try {
      setErrorMessage("");

      if (!invoiceId) {
        setErrorMessage("No se encontró el ID de la factura.");
        return;
      }

      if (!creditNoteNumber.trim()) {
        setErrorMessage("Ingrese el número de nota de crédito.");
        return;
      }

      const details = creditNoteItems
        .filter((item) => item.selected)
        .map((item) => ({
          productId: item.productId,
          quantity: Number(item.returnQty),
          unitCost: String(item.unitPrice),
        }));

      if (details.length === 0) {
        setErrorMessage("Seleccione al menos un producto para la nota de crédito.");
        return;
      }

      const hasInvalidProduct = details.some((detail) => !detail.productId);

      if (hasInvalidProduct) {
        setErrorMessage("Uno o más productos no tienen productId.");
        return;
      }

      const payload = {
        creditNoteNumber: creditNoteNumber.trim(),
        createdAt: getTodayLocalDate(),
        saleInvoiceId: invoiceId,
        details,
      };

      setIsSaving(true);

      const createdCreditNote = await createCreditNote(payload);

      onCreated?.(createdCreditNote);

      alert("Nota de Crédito Generada");
      onClose();
    } catch (error) {
      setErrorMessage(error.message || "Error al crear la nota de crédito.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-[15px] shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex justify-between items-baseline w-full">
            <h2 className="text-2xl font-bold text-slate-800 ml-5">
              Nueva Nota de Crédito
            </h2>

            <h2 className="text-2xl font-bold text-slate-800 mr-10">
              Factura #{invoiceNumber}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
            type="button"
          >
            &times;
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 py-4">
          <label className="mb-1 block text-sm font-bold text-slate-700">
            Número de Nota de Crédito
          </label>

          <input
            value={creditNoteNumber}
            onChange={(e) => setCreditNoteNumber(e.target.value)}
            placeholder="Ej: NC-001"
            className="w-full max-w-xs rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#185BFF] focus:ring-2 focus:ring-[#185BFF]/10"
          />

          {errorMessage && (
            <p className="mt-2 text-sm font-medium text-red-500">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          <NewCreditNoteTable
            items={creditNoteItems}
            onToggleItem={handleToggleItem}
            onToggleAll={handleToggleAll}
            onChangeQuantity={handleChangeQuantity}
          />
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-[8px] font-bold text-[14px] text-slate-500 hover:bg-slate-100 transition-all disabled:opacity-50"
            type="button"
          >
            Cancelar
          </button>

          <ActionButton
            variant="primary"
            type={isSaving ? "guardando" : "guardar"}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}