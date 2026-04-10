use crate::modules::invoice::repository;
use crate::modules::invoice::dto::response::InvoiceResponse;
use crate::shared::db_config::DbError;

pub async fn list_invoices(contains: Option<String>) -> Result<Vec<InvoiceResponse>, DbError> {
    let rows= repository::query_invoices(contains.as_deref()).await?;
    Ok(rows.into_iter().map(|inv| InvoiceResponse::from(inv)).collect())
}

pub async fn get_invoice(id: i32) -> Result<Option<InvoiceResponse>, DbError> {
    let invoice = repository::query_invoice_by_id(id).await?;
    Ok(invoice.map(|inv| InvoiceResponse::from(inv)))
}
