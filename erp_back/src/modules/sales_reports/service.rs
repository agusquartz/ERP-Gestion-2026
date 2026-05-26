use chrono::NaiveDate;
use crate::modules::sales_reports::dto::DynamicReportResponse;
use crate::modules::sales_reports::errors::ServiceError; // <--- Importamos tu nuevo Enum
use crate::modules::sales_reports::repository;

pub async fn generate_sales_report(
    report_type: String,
    since: NaiveDate,
    to: NaiveDate,
) -> Result<DynamicReportResponse, ServiceError> { // <--- Cambiado a ServiceError
    
    // El operador `?` ejecutará el `From<DbError>` que escribimos arriba de forma automática
    let report_data = repository::execute_sales_report(report_type, since, to).await?;

    Ok(DynamicReportResponse {
        headers: report_data.headers,
        rows: report_data.rows,
    })
}