use chrono::NaiveDate;
use serde::Serialize;
use serde_json::{json, Value};
use crate::shared::db_config;

// Estructura limpia y unificada que viajará al Frontend en el API
#[derive(Serialize)]
pub struct DynamicReportDto {
    pub headers: Vec<String>,
    pub rows: Vec<Value>,
}

/// Obtiene los productos más vendidos en un rango de fechas determinado.
/// Utiliza `tokio-postgres` simulando el patrón de tus compañeros.
pub async fn query_top_selling_products(
    since: NaiveDate,
    to: NaiveDate,
) -> Result<DynamicReportDto, db_config::DbError> {
    let client = db_config::get_client().await?;

    // Query SQL exacta basada en tus tablas de facturas y detalles
    let sql = r#"
        SELECT 
            p.code AS product_code,
            p.description AS product_description,
            SUM(sid.quantity)::INT4 AS total_quantity,
            SUM(sid.quantity * sid.unit_cost)::FLOAT8 AS total_amount
        FROM sale_invoice_details sid
        JOIN sales_invoices si ON sid.invoice_id = si.id
        JOIN products p ON sid.product_id = p.id
        WHERE si.date BETWEEN $1 AND $2
        GROUP BY p.id, p.code, p.description
        ORDER BY total_quantity DESC
        LIMIT 15
    "#;

    // Ejecutamos la consulta pasando las fechas como parámetros nativos
    let rows = client.query(sql, &[&since, &to]).await?;

    // 1. Definimos los encabezados estéticos que leerá el frontend directamente
    let headers = vec![
        "Código".to_string(),
        "Producto".to_string(),
        "Cant. Vendida".to_string(),
        "Total Recaudado".to_string(),
    ];

    // 2. Mapeamos de forma dinámica cada fila recuperada a un objeto JSON compatible con JS
    let report_rows: Vec<Value> = rows
        .iter()
        .map(|row| {
            // Extraemos los tipos nativos de Postgres que definimos en la Query
            let code: String = row.get("product_code");
            let description: String = row.get("product_description");
            let qty: i32 = row.get("total_quantity");
            let total: f64 = row.get("total_amount");

            // Creamos las llaves idénticas a los headers para facilitar el mapeo en React
            json!({
                "Código": code,
                "Producto": description,
                "Cant. Vendida": qty,
                "Total Recaudado": total,
            })
        })
        .collect();

    Ok(DynamicReportDto {
        headers,
        rows: report_rows,
    })
}