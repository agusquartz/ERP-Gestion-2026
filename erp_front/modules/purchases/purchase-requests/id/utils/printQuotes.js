/**
 * @file printQuotes.js
 * @description Opens a clean print window with one page per supplier quote.
 *
 * Each page shows:
 * - Purchase request header (id, requester, date)
 * - Supplier name and quote date
 * - Items table (code, product, requested qty, confirmed qty, unit cost)
 *
 * No sidebar, no buttons, no layout chrome.
 */

/**
 * @param {Object} params
 * @param {Object} params.purchaseRequest  - { id, requester, createdAt }
 * @param {Object[]} params.suppliers      - array of supplier rows to print
 * @param {Object[]} params.orderItems     - full item list for cross-referencing
 */
export function printQuotes({ purchaseRequest, suppliers, orderItems }) {
  if (!suppliers || suppliers.length === 0) return;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString("es-PY", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const formatCurrency = (value) => {
    const n = Number(value);
    return isNaN(n) ? "—" : n.toLocaleString("es-PY", { minimumFractionDigits: 2 });
  };

  const pages = suppliers.map((supplier) => {
    const items = (supplier.quotationItems ?? []).filter((qi) => !qi.excluded);

    const rows = items.map((qi, i) => {
      const orderItem = orderItems.find((o) => o.productId === qi.productId);
      return `
        <tr>
          <td>${i + 1}</td>
          <td class="mono">${qi.code || orderItem?.code || "—"}</td>
          <td>${qi.product || orderItem?.product || qi.productId}</td>
          <td class="center">${qi.requestedQty ?? orderItem?.quantity ?? "—"}</td>
          <td class="center">${qi.confirmedQty ?? 0}</td>
          <td class="right">$ ${formatCurrency(qi.unitPrice)}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="page">
        <!-- Header empresa -->
        <div class="header">
          <div>
            <h1 class="company">Neumáticos Enc SA</h1>
            <p class="sub">Venta Minorista</p>
          </div>
          <div class="right-block">
            <p class="doc-title">Solicitud de Cotización</p>
            <p class="doc-sub">Pedido de compra #${purchaseRequest?.id ?? "—"}</p>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Info pedido + proveedor -->
        <div class="meta-grid">
          <div>
            <p class="meta-label">Solicitante</p>
            <p class="meta-value">${purchaseRequest?.requester ?? "—"}</p>
          </div>
          <div>
            <p class="meta-label">Fecha del pedido</p>
            <p class="meta-value">${formatDate(purchaseRequest?.createdAt)}</p>
          </div>
          <div>
            <p class="meta-label">Proveedor</p>
            <p class="meta-value">${supplier.name}</p>
          </div>
          <div>
            <p class="meta-label">Fecha de cotización</p>
            <p class="meta-value">${formatDate(supplier.createdAt)}</p>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Tabla de items -->
        <p class="section-label">Ítems a cotizar</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Código</th>
              <th>Producto</th>
              <th class="center">Cant. Solicitada</th>
              <th class="center">Cant. Confirmada</th>
              <th class="right">Precio Unit.</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" class="center">Sin ítems activos</td></tr>'}
          </tbody>
        </table>

        <!-- Firma -->
        <div class="signature-row">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Firma del proveedor</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Sello</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Fecha</p>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Cotizaciones — Pedido #${purchaseRequest?.id ?? ""}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #1a1a1a;
      background: white;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 18mm;
      page-break-after: always;
    }

    .page:last-child { page-break-after: avoid; }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .company { font-size: 18px; font-weight: 700; color: #111; }
    .sub { font-size: 11px; color: #666; margin-top: 2px; }
    .right-block { text-align: right; }
    .doc-title { font-size: 15px; font-weight: 700; color: #185BFF; }
    .doc-sub { font-size: 11px; color: #555; margin-top: 3px; }

    .divider {
      border-top: 1px solid #e2e8f0;
      margin: 12px 0;
    }

    /* Meta grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
      margin-bottom: 4px;
    }
    .meta-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #888;
      margin-bottom: 2px;
    }
    .meta-value { font-size: 12px; font-weight: 500; color: #111; }

    /* Section label */
    .section-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #888;
      margin-bottom: 8px;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    thead tr {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      padding: 7px 10px;
      text-align: left;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tbody tr:last-child td { border-bottom: none; }
    .center { text-align: center; }
    .right { text-align: right; }
    .mono { font-family: monospace; font-size: 10px; color: #555; }

    /* Signature */
    .signature-row {
      display: flex;
      gap: 32px;
      margin-top: 48px;
    }
    .signature-box {
      flex: 1;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
    .signature-line {
      border-top: 1px solid #aaa;
      margin-bottom: 6px;
      margin-top: 32px;
    }

    @media print {
      body { margin: 0; }
      .page { margin: 0; padding: 15mm 15mm; }
    }
  </style>
</head>
<body>
  ${pages}
  <script>
    window.onload = function () {
      window.print();
      window.onafterprint = function () { window.close(); };
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("El navegador bloqueó la ventana emergente. Permitila para imprimir.");
    return;
  }
  win.document.write(html);
  win.document.close();
}