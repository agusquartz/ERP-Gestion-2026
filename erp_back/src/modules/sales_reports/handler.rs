use axum::{
    extract::Query,
    http::StatusCode,
    Json,
};

use crate::modules::sales::dto::{SalesReportQuery, DynamicReportResponse};
use crate::modules::sales::service;

/// GET /sales/reports
/// GET /sales/reports?report_type=top_selling_products&since=2026-01-01&to=2026-05-26
pub async fn get_sales_report(
    Query(query): Query<SalesReportQuery>,
) -> Result<Json<DynamicReportResponse>, StatusCode> {
    
    // Ejecutamos el reporte llamando a la capa de servicio
    let result = service::generate_sales_report(query.report_type, query.since, query.to)
        .await
        .map_err(|err| {
            eprintln!("Error en reporte de ventas: {:?}", err);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(result))
}