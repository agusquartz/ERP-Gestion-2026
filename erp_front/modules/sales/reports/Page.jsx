"use client";

import { useState } from "react";
import { getSalesReport } from "@/lib/http/client/sales_reports"
import { DynamicReportTable } from "./DinamicReportTable";

export default function SalesReportsPage() {
  // Estados para los filtros del formulario
  const [reportType, setReportType] = useState("top_selling_products");
  const [sinceDate, setSinceDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  // Estados para el control de la petición
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para consultar al Backend en Rust
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    
    if (!sinceDate || !toDate) {
      setError("Por favor, selecciona ambas fechas.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
    const data = await getSalesReport({
        reportType,
        since: sinceDate,
        to: toDate
    });

    setReportData(data);
    } catch (err) {
    console.error("Error fetching report:", err);
    setError(err.message || "Hubo un error interno al generar el reporte.");
    setReportData(null);
    } finally {
    setLoading(false);
    }
  }
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Encabezado de la Pantalla */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reportes de Ventas</h1>
        <p className="text-sm text-slate-500">Genera análisis detallados de los movimientos de venta del sistema.</p>
      </div>

      {/* Panel de Filtros (Formulario) */}
      <div className="bg-white p-5 rounded-[4px] border border-slate-200 shadow-sm">
        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* Selector de Reporte */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Tipo de Reporte
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="h-10 px-3 rounded-[4px] border border-slate-300 text-sm text-slate-700 bg-white focus:outline-none focus:border-slate-500 transition-colors"
            >
              <option value="top_selling_products">Productos más vendidos</option>
              <option value="top_buying_clients">Clientes que más compraron</option>
              <option value="monthly_sales_summary">Resumen de ventas mensual</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Fecha Desde
            </label>
            <input
              type="date"
              value={sinceDate}
              onChange={(e) => setSinceDate(e.target.value)}
              className="h-10 px-3 rounded-[4px] border border-slate-300 text-sm text-slate-700 focus:outline-none focus:border-slate-500 transition-colors"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 px-3 rounded-[4px] border border-slate-300 text-sm text-slate-700 focus:outline-none focus:border-slate-500 transition-colors"
            />
          </div>

          {/* Botón de Acción */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-[4px] transition-colors flex items-center justify-center disabled:bg-slate-400"
            >
              {loading ? "Procesando..." : "Generar Reporte"}
            </button>
          </div>
        </form>
      </div>

      {/* Manejo de Alertas de Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-sm text-red-600 rounded-[4px]">
          {error}
        </div>
      )}

      {/* Sección del Reporte / Tabla Dinámica */}
      <div className="mt-4">
        {loading ? (
          <div className="text-center py-12 text-sm text-slate-500 font-medium">
            Buscando registros y procesando métricas...
          </div>
        ) : (
          <DynamicReportTable reportData={reportData} />
        )}
      </div>
    </div>
  );
}