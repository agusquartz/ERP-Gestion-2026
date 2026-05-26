use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Parámetros de consulta que viajan en la URL (?report_type=...&since=...&to=...)
#[derive(Deserialize)]
pub struct SalesReportQuery {
    pub report_type: String,
    pub since: NaiveDate,
    pub to: NaiveDate,
}

/// Respuesta estructurada que el Frontend leerá dinámicamente
#[derive(Serialize)]
pub struct DynamicReportResponse {
    pub headers: Vec<String>,
    pub rows: Vec<Value>,
}