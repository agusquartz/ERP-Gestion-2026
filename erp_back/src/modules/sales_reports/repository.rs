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

/// Ejecuta una consulta analítica basada en el tipo de reporte y un rango de fechas.
pub async fn execute_sales_report(
    report_type: String,
    since: NaiveDate,
    to: NaiveDate,
) -> Result<DynamicReportDto, db_config::DbError> {
    let client = db_config::get_client().await?;

    match report_type.as_str() {
// =====================================================================
// REPORTE 1: PRODUCTOS MÁS VENDIDOS
// =====================================================================
"top_selling_products" => {
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

    let rows = client.query(sql, &[&since, &to]).await?;
    let headers = vec![
        "Código".to_string(),
        "Producto".to_string(),
        "Cant. Vendida".to_string(),
        "Total Recaudado".to_string(),
    ];

    let report_rows = rows.iter().map(|row| {
        // Extraemos con el tipo explícito para que no falle el scope
        let code: String = row.get("product_code");
        let description: String = row.get("product_description");
        let qty: i32 = row.get("total_quantity");
        let total: f64 = row.get("total_amount");

        json!({
            "Código": code,
            "Producto": description,
            "Cant. Vendida": qty,
            "Total Recaudado": format!("$ {:.0}", total),
        })
    }).collect();

    Ok(DynamicReportDto { headers, rows: report_rows })
},

// =====================================================================
// REPORTE 2: CLIENTES QUE MÁS COMPRARON
// =====================================================================
"top_buying_clients" => {
    let sql = r#"
        SELECT 
            c.document AS client_doc,
            c.name || ' ' || c.surname AS client_name,
            COUNT(si.id)::INT4 AS total_invoices,
            SUM(si.total)::FLOAT8 AS total_spent
        FROM sales_invoices si
        JOIN clients c ON si.client_id = c.id
        WHERE si.date BETWEEN $1 AND $2
        GROUP BY c.id, c.document, c.name, c.surname
        ORDER BY total_spent DESC
        LIMIT 15
    "#;

    let rows = client.query(sql, &[&since, &to]).await?;
    let headers = vec![
        "Documento".to_string(),
        "Cliente".to_string(),
        "Cant. Facturas".to_string(),
        "Total Comprado".to_string(),
    ];

    let report_rows = rows.iter().map(|row| {
        let doc: String = row.get("client_doc");
        let name: String = row.get("client_name");
        let invoices: i32 = row.get("total_invoices");
        let spent: f64 = row.get("total_spent");

        json!({
            "Documento": doc,
            "Cliente": name,
            "Cant. Facturas": invoices,
            "Total Comprado": format!("$ {:.0}", spent),
        })
    }).collect();

    Ok(DynamicReportDto { headers, rows: report_rows })
},

// =====================================================================
// REPORTE 3: CUÁNTO SE VENDIÓ POR MES (RESUMEN MENSUAL)
// =====================================================================
"monthly_sales_summary" => {
    let sql = r#"
        SELECT 
            TO_CHAR(si.date, 'YYYY-MM') AS sales_month,
            COUNT(si.id)::INT4 AS invoice_count,
            SUM(si.total)::FLOAT8 AS total_revenue
        FROM sales_invoices si
        WHERE si.date BETWEEN $1 AND $2
        GROUP BY TO_CHAR(si.date, 'YYYY-MM')
        ORDER BY sales_month DESC
    "#;

    let rows = client.query(sql, &[&since, &to]).await?;
    let headers = vec![
        "Mes Año".to_string(),
        "Cant. Ventas".to_string(),
        "Recaudación Total".to_string(),
    ];

    let report_rows = rows.iter().map(|row| {
        let month: String = row.get("sales_month");
        let count: i32 = row.get("invoice_count");
        let revenue: f64 = row.get("total_revenue");

        json!({
            "Mes Año": month,
            "Cant. Ventas": count,
            "Recaudación Total": format!("$ {:.0}", revenue),
        })
    }).collect();

    Ok(DynamicReportDto { headers, rows: report_rows })
},

        // Si mandan un reporte que no está registrado en el sistema
        _ => Err(db_config::DbError::NotFound),
    }
}