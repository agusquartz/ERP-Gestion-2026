use chrono::NaiveDate;
use crate::modules::sales::dto::DynamicReportResponse;
use crate::modules::sales::repository;
use crate::shared::db_config;

/// Orquesta la ejecución del reporte interactuando con el repositorio
pub async fn generate_sales_report(
    report_type: String,
    since: NaiveDate,
    to: NaiveDate,
) -> Result<DynamicReportResponse, db_config::DbError> {
    
    // Aquí es donde en el futuro puedes evaluar dinámicamente el `report_type` 
    // Para este primer paso, llamamos directamente al repositorio que creamos antes
    let report_data = repository::query_top_selling_products(since, to).await?;

    // Mapeamos el resultado interno del repositorio al DTO de salida
    Ok(DynamicReportResponse {
        headers: report_data.headers,
        rows: report_data.rows,
    })
}