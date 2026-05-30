use axum::{
    extract::Query,
    http::StatusCode,
    Json,
};

use crate::modules::sales_reports::dto::{SalesReportQuery, DynamicReportResponse};
use crate::modules::sales_reports::errors::ServiceError; // <--- Importamos el Enum
use crate::modules::sales_reports::service;

/// GET /sales/reports
pub async fn get_sales_report(
    Query(query): Query<SalesReportQuery>,
) -> Result<Json<DynamicReportResponse>, StatusCode> {
    
    let result = service::generate_sales_report(query.report_type, query.since, query.to)
        .await
        .map_err(|err| match err {
            // Mapeo semántico de errores a Códigos de estado HTTP
            ServiceError::NotFound(_) => StatusCode::NOT_FOUND,         // 404
            ServiceError::Validation(_) => StatusCode::BAD_REQUEST,     // 400
            _ => {
                eprintln!("Internal Sales Report Error: {}", err);
                StatusCode::INTERNAL_SERVER_ERROR                       // 500
            }
        })?;

    Ok(Json(result))
}