/**
 * -----------------------------------------------------------------------------
 * printQuotes.js
 * -----------------------------------------------------------------------------
 *
 * Utility function that opens a new browser window and prints supplier quotes.
 *
 * This function generates a standalone HTML document with print-friendly styles.
 * Each supplier is rendered on its own page.
 *
 * Main responsibilities:
 * -----------------------------------------------------------------------------
 * - Build printable HTML for one or more quotations.
 * - Format dates and currency values.
 * - Cross-reference quotation items with the purchase request items.
 * - Open a new window and trigger the browser print dialog.
 *
 * Expected input:
 * -----------------------------------------------------------------------------
 * @param {Object} params
 * @param {Object} params.purchaseRequest
 * Purchase request header data.
 * Expected shape:
 * {
 *   id,
 *   requester,
 *   createdAt
 * }
 *
 * @param {Object[]} params.suppliers
 * Array of supplier quotation objects to print.
 *
 * @param {Object[]} params.orderItems
 * Full list of purchase request items.
 *
 * Return:
 * -----------------------------------------------------------------------------
 * - Returns nothing when there are no suppliers.
 * - Otherwise opens a new print window and calls window.print().
 * -----------------------------------------------------------------------------
 */

/**
 * Opens a clean print window with one page per supplier quote.
 *
 * Each printed page includes:
 * - company header
 * - purchase request metadata
 * - supplier metadata
 * - item table
 * - signature area
 *
 * @param {Object} params
 * @param {Object} params.purchaseRequest
 * @param {Object[]} params.suppliers
 * @param {Object[]} params.orderItems
 */
export function printQuotes({ purchaseRequest, suppliers, orderItems }) {
  /**
   * Prevent printing when there is nothing to print.
   */
  if (!suppliers || suppliers.length === 0) return;

  /**
   * Formats a date into a readable locale string.
   *
   * If the value is missing, returns a dash.
   * If the value cannot be parsed, returns the original input.
   *
   * @param {string|Date} dateStr
   * @returns {string}
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";

    const d = new Date(dateStr);
    return isNaN(d)
      ? dateStr
      : d.toLocaleDateString("es-PY", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  /**
   * Formats numeric values as localized currency-like numbers.
   *
   * Note:
   * - This does not add a currency symbol by itself.
   * - The caller inserts "$" in the template where needed.
   *
   * @param {number|string} value
   * @returns {string}
   */
  const formatCurrency = (value) => {
    const n = Number(value);
    return isNaN(n)
      ? "—"
      : n.toLocaleString("es-PY", { minimumFractionDigits: 2 });
  };

  /**
   * Builds the HTML for all pages.
   *
   * Each supplier gets one page.
   * Only active quotation items are included:
   * - excluded items are omitted
   */
  const pages = suppliers
    .map((supplier) => {
      /**
       * Keep only active rows.
       */
      const items = (supplier.quotationItems ?? []).filter((qi) => !qi.excluded);

      /**
       * Render quotation rows as HTML table rows.
       */
      const rows = items
        .map((qi, i) => {
          const orderItem = orderItems.find(
            (o) => o.productId === qi.productId
          );

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
        })
        .join("");

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

          <!-- Metadata section: request and supplier info -->
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

          <!-- Items table -->
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
              ${
                rows ||
                '<tr><td colspan="6" class="center">Sin ítems activos</td></tr>'
              }
            </tbody>
          </table>

          <!-- Signature area -->
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
    })
    .join("");

  /**
   * Complete printable HTML document.
   *
   * The document includes:
   * - a print-specific layout
   * - page breaks between suppliers
   * - inline styles for compatibility
   * - automatic print trigger on load
   */
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
      window.onafterprint = function () {
        window.close();
      };
    };
  </script>
</body>
</html>`;

  /**
   * Open a new browser window and inject the printable document.
   */
  const win = window.open("", "_blank", "width=900,height=700");

  /**
   * If the popup is blocked, inform the user.
   */
  if (!win) {
    alert("El navegador bloqueó la ventana emergente. Permitila para imprimir.");
    return;
  }

  win.document.write(html);
  win.document.close();
}