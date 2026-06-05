import { clientRequest } from "./request";

/**
 * Obtiene los datos de un reporte de ventas dinámico según el tipo y rango de fechas.
 * * @param {Object} params - Parámetros del reporte
 * @param {string} params.reportType - El identificador del reporte (ej: 'top_selling_products')
 * @param {string} params.since - Fecha de inicio en formato 'YYYY-MM-DD'
 * @param {string} params.to - Fecha de fin en formato 'YYYY-MM-DD'
 */
export function getSalesReport({ reportType, since, to } = {}) {
  if (!reportType) throw new Error("Report type is required");
  if (!since || !to) throw new Error("Both 'since' and 'to' dates are required");

  const params = new URLSearchParams();
  
  params.set("report_type", reportType.trim());
  params.set("since", since.trim());
  params.set("to", to.trim());

  return clientRequest(`/sales/reports?${params.toString()}`, {
    method: "GET",
  });
}