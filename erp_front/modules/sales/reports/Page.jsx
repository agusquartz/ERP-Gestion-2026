"use client";

import { useState, useEffect } from "react";
import { getSalesReport } from "@/lib/http/client/sales_reports";
import { DinamicReportTable } from "./DinamicReportTable";

export default function SalesReportsPage() {
  // Estados para los filtros del formulario
  const [reportType, setReportType] = useState("top_selling_products");
  const [sinceDate, setSinceDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  // Estados para el control de la petición
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🕒 Estado seguro para la fecha impresiva (Evita errores de Hydration)
  const [printDate, setPrintDate] = useState("");

  useEffect(() => {
    if (reportData) {
      setPrintDate(new Date().toLocaleString());
    }
  }, [reportData]);

  // Función para consultar al Backend en Rust
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    
    if (!sinceDate || !toDate) {
      setError("Por favor, selecciona ambas fechas.");
      return;
    }

    // Validación de fechas invertidas
    if (new Date(sinceDate) > new Date(toDate)) {
      setError("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'. Por favor, verifica el rango.");
      setReportData(null); 
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
  };

  const getReportTitle = () => {
    if (reportType === "top_selling_products") return "PRODUCTOS MÁS VENDIDOS";
    if (reportType === "top_buying_clients") return "CLIENTES QUE MÁS COMPRARON";
    return "RESUMEN DE VENTAS MENSUAL";
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px] space-y-4 print:bg-white print:p-0 print:m-0">
      
      {/* 🛠️ INYECCIÓN CSS PARA CONTROLAR LA HOJA DE IMPRESIÓN EXCLUSIVA */}
      <style jsx global>{`
        @media print {
          /* Oculta de raíz el sidebar y cualquier contenedor padre ajeno al reporte */
          aside, nav, [class*="sidebar"], [class*="Sidebar"] {
            display: none !important;
          }
          /* Fuerza a que el contenedor principal ocupe todo el papel disponible */
          main, body, html, div {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* 🖨️ ENCABEZADO DE IMPRESIÓN PROFESIONAL (Solo papel) */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6 w-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Neumáticos Enc sa</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Sistema Integral de Gestión ERP</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold text-slate-800">{getReportTitle()}</h2>
            <p className="text-xs text-slate-600 font-medium">Período: {sinceDate} al {toDate}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Generado el: {printDate}</p>
          </div>
        </div>
      </div>

      {/* Encabezado de la Pantalla (Oculto en impresión) */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-slate-800">Reportes de Ventas</h1>
        <p className="text-sm text-slate-500">Genera análisis detallados de los movimientos de venta del sistema.</p>
      </div>

      {/* Panel de Filtros (Formulario) (Oculto en impresión) */}
      <div className="bg-white p-5 rounded-[4px] border border-slate-200 shadow-sm print:hidden">
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
              className="w-full h-10 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-sm font-medium text-primary-foreground rounded-[4px] shadow-sm transition-colors duration-200 cursor-pointer flex items-center justify-center"
            >
              {loading ? "Procesando..." : "Generar Reporte"}
            </button>
          </div>
        </form>
      </div>

      {/* Manejo de Alertas de Error (Oculto en impresión) */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-sm text-red-600 rounded-[4px] print:hidden">
          {error}
        </div>
      )}

      {/* 🖨️ Botón de Impresión Directa */}
      {reportData && !loading && (
        <div className="flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-[4px] hover:bg-slate-900 transition-colors shadow-sm"
          >
            🖨️ Imprimir Reporte
          </button>
        </div>
      )}

      {/* Sección del Reporte / Tabla Dinámica */}
      <div className="mt-2 print:mt-0 print:p-0 print:border-none">
        {loading ? (
          <div className="text-center py-12 text-sm text-slate-500 font-medium print:hidden">
            Buscando registros y procesando métricas...
          </div>
        ) : (
          <DinamicReportTable reportData={reportData} />
        )}
      </div>
    </div>
  );
}