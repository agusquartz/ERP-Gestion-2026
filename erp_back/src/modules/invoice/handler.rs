use axum::{
    extract::{Path,Query},
    http::StatusCode,
    Json,
};

use crate::modules::invoice::dto::{InvoiceListQuery, response::InvoiceResponse};
use crate::modules::invoice::service;

///GET /invoices
///GET /invoices?contains=string
pub async fn list_invoices(
    Query(query): Query<InvoiceListQuery>,
) -> Result<Json<Vec<InvoiceResponse>>,StatusCode> {
    let result = service::list_invoices(query.contains).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(result))
}

pub async fn get_invoice(
    Path(id): Path<i32>
) -> Result<Json<InvoiceResponse>, StatusCode> {
    let result= service::get_invoice(id).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    match result {
        Some(result) => Ok(Json(result)),
        None => Err(StatusCode::NOT_FOUND)
    }
}
