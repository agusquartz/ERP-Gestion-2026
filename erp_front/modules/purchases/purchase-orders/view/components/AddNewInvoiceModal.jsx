"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../../../../../shared/components/Modal";
import { ActionButton } from "./ActionButton";

export function AddInvoiceModal({ open, onClose, order, onConfirm }) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [useCreditSale, setUseCreditSale] = useState(false);
  const [saleConditionId, setSaleConditionId] = useState("1");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // Initialize modal state from purchase order
  useEffect(() => {
    if (order?.details) {
      const initialItems = order.details.map((detail) => ({
        // Flatten nested product data
        productId: detail.product.id,
        productCode: detail.product.code,
        productName: detail.product.description,

        orderedQuantity: detail.orderedQuantity,
        receivedQuantity: detail.receivedQuantity || 0,

        faltante:
          detail.orderedQuantity - (detail.receivedQuantity || 0),

        // UI-only fields
        cantRecibida: 0,
        unitPrice: 0,
        subtotal: 0,
      }));

      setItems(initialItems);
      setError("");
    }
  }, [order, open]);

  // Centralized recalculation logic
  const recompute = (item, overrides = {}) => {
    const qty = overrides.cantRecibida ?? item.cantRecibida;
    const price = overrides.unitPrice ?? item.unitPrice;

    // If quantity becomes 0, clean the price too
    const cleanPrice = qty === 0 ? 0 : price;

    const subtotal = qty * cleanPrice;

    return {
      ...item,
      ...overrides,
      unitPrice: cleanPrice,
      subtotal,
    };
  };

  // Quantity change handler
  const handleQtyChange = (productId, value) => {
    let qty = parseInt(value);

    if (isNaN(qty) || qty < 0) {
      qty = 0;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          // Prevent receiving more than remaining
          if (qty > item.faltante) {
            qty = item.faltante;
          }

          return recompute(item, {
            cantRecibida: qty,
          });
        }

        return item;
      })
    );
  };

  // Price change handler
  const handlePriceChange = (productId, value) => {
    let price = parseFloat(value);

    if (isNaN(price) || price < 0) {
      price = 0;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? recompute(item, {
              unitPrice: price,
            })
          : item
      )
    );
  };

  // Total invoice amount
  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  // Save handler
  const handleSave = () => {
    setError("");

    const filteredItems = items.filter(
      (item) => item.cantRecibida > 0
    );

    // ===== VALIDATIONS =====

    if (!invoiceNumber.trim()) {
      setError("Debe ingresar el número de factura.");
      return;
    }

    if (filteredItems.length === 0) {
      setError(
        "Debe ingresar al menos un producto con cantidad recibida."
      );
      return;
    }

    for (const item of filteredItems) {
      if (item.cantRecibida > item.faltante) {
        setError(
          `La cantidad recibida para el producto ${item.productCode} excede el faltante.`
        );
        return;
      }

      if (item.cantRecibida > item.orderedQuantity) {
        setError(
          `La cantidad recibida para el producto ${item.productCode} excede la cantidad ordenada.`
        );
        return;
      }

      if (item.unitPrice <= 0) {
        setError(
          `Debe ingresar un precio válido para el producto ${item.productCode}.`
        );
        return;
      }
    }


    // ===== INVOICE PAYLOAD =====
    const invoice = {
      invoiceNumber,
      supplierId: order?.supplier?.id,
      orderId: order.id,
	  saleConditionId,

      items: filteredItems.map((item) => ({
		  product: {
			  productId: item.productId,
			  productCode: item.productCode,
			  productName: item.productName
		  },

        quantity: item.cantRecibida,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),

      total,
    };

    // payload
    const payload = invoice;
    onConfirm(payload);
  };

  return (
    <Modal open={open} onClose={onClose} width={1150}>
      <div className="flex flex-col gap-6 text-[#1a1a1a]">
        <h2 className="text-2xl font-bold">
          Ingresar Factura
        </h2>

        {/* Top Info Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
			<div className="flex items-center gap-4">
			  <label className="w-24 font-medium">
				Factura Nº:
			  </label>

			  <input
				type="text"
				value={invoiceNumber}
				onChange={(e) =>
				  setInvoiceNumber(e.target.value)
				}
				className="flex-1 border border-gray-300 rounded px-3 py-1 outline-none focus:border-blue-500"
			  />

			  <label className="flex items-center gap-2 text-sm whitespace-nowrap">
				<input
				  type="checkbox"
				  checked={useCreditSale}
				  onChange={(e) => {
					const checked = e.target.checked;

					setUseCreditSale(checked);

					setSaleConditionId(
					  checked ? "2" : "1"
					);
				  }}
				  className="cursor-pointer"
				/>

				Crédito
			  </label>
			</div>
           <div className="flex items-center gap-4">
            <label className="font-medium w-40">
              Orden De Compra Nº:
            </label>

            <span>{order?.id}</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-24 font-medium">
              Timbrado:
            </label>

	  		<span>{order?.supplier.stamp}</span>
           </div>

          <div className="flex items-center gap-4">
            <label className="font-medium w-40">
              Proveedor:
            </label>

            <span>{order?.supplier?.name}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-4">
          <p className="text-[11px] font-bold text-gray-500 mb-2 tracking-wider">
            ITEMS DE LA ORDEN
          </p>

          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#E5E7EB] text-gray-700">
                <tr>
                  <th className="px-4 py-2 w-12">
                    #
                  </th>

                  <th className="px-4 py-2">
                    Codigo
                  </th>

                  <th className="px-4 py-2">
                    Producto
                  </th>

                  <th className="px-4 py-2">
                    Cant. Ordenada
                  </th>

                  <th className="px-4 py-2">
                    Cant. Faltante
                  </th>

                  <th className="px-4 py-2 w-36">
                    Cant. Recibida
                  </th>

                  <th className="px-4 py-2 w-40">
                    Precio Unit.
                  </th>

                  <th className="px-4 py-2 w-40">
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {items.map((item, idx) => (
                  <tr
                    key={item.productId}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {item.productCode}
                    </td>

                    <td className="px-4 py-3">
                      {item.productName}
                    </td>

                    <td className="px-4 py-3">
                      {item.orderedQuantity}
                    </td>

                    <td className="px-4 py-3">
                      {item.faltante}
                    </td>

                    {/* Quantity Input */}
                    <td className="px-4 py-3">
                      {item.faltante <= 0 ? (
                        <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded border border-green-200 block text-center">
                          Completado!
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max={item.faltante}
                          value={item.cantRecibida}
                          onChange={(e) =>
                            handleQtyChange(
                              item.productId,
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 outline-none text-right"
                        />
                      )}
                    </td>

                    {/* Price Input */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={
                          item.cantRecibida === 0
                        }
                        value={item.unitPrice}
                        onChange={(e) =>
                          handlePriceChange(
                            item.productId,
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 outline-none text-right disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </td>

                    {/* Subtotal */}
                    <td className="px-4 py-3 text-right font-medium">
                      {item.subtotal > 0
                        ? `$ ${item.subtotal.toFixed(2)}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end items-center gap-4 text-sm font-bold pr-4">
          <span>Total:</span>

          <span
            className={
              total > 0
                ? "text-blue-600"
                : "text-gray-400"
            }
          >
            {total > 0
              ? `$ ${total.toFixed(2)}`
              : "NO-DATA"}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-center gap-12 mt-4">
          <ActionButton
            variant="secondary"
            text="Atras"
            onClick={onClose}
            className="min-w-[180px] !border-blue-500 !text-blue-500"
          />

          <ActionButton
            variant="primary"
            text="Agregar Factura"
            onClick={handleSave}
            className="min-w-[180px]"
          />
        </div>
      </div>
    </Modal>
  );
}
