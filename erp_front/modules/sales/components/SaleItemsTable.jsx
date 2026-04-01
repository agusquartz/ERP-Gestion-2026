"use client";

import { s } from "../styles/salesStyles";
import { TrashIcon } from "@/shared/components/Icons";

/**
 * Tabla de productos agregados a la venta.
 *
 * Props:
 *   items        - array de items
 *   onQtyChange  - (id, value) => void
 *   onRemove     - (id) => void
 */
export function SaleItemsTable({ items, onQtyChange, onRemove }) {
  const totalUnidades = items.reduce((sum, i) => sum + i.cantidad, 0);

  return (
    <div style={s.tableSection}>
      <div style={s.tableWrap}>
        <table style={{ ...s.table, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: 130 }} />
            <col />
            <col style={{ width: 90 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 56 }} />
          </colgroup>
          <thead>
           <tr style={{ background: "#F3F4F6" }}>
              {["#", "Código", "Descripción", "Cantidad", "Precio", "Subtotal", "Acción"].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} style={s.tr}>
                <td style={s.td}>{i + 1}</td>
                <td style={s.td}>{item.codigo}</td>
                <td
                  style={{ ...s.td, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={item.descripcion}
                >
                  {item.descripcion}
                </td>
                <td style={s.td}>
                  <input
                    type="number"
                    min={1}
                    value={item.cantidad}
                    onChange={(e) => onQtyChange(item.id, e.target.value)}
                    style={s.qtyInput}
                  />
                </td>
                <td style={s.td}>${item.precio}</td>
                <td style={s.td}>${item.subtotal}</td>
                <td style={s.td}>
                  <button style={s.btnRemove} onClick={() => onRemove(item.id)}>
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "36px 0", color: "#bbb", fontSize: 13 }}>
                  No hay productos. Buscá uno desde el panel derecho.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={s.tableFooter}>
        <span>Items: {items.length}</span>
        <span>Unidades totales: {totalUnidades}</span>
      </div>
    </div>
  );
}
