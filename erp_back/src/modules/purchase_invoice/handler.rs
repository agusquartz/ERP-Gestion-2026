//! Purchase invoice HTTP handlers
//!
//! HTTP boundary — extracts data, delegates to service, returns responses.
//! Mirrors `purchase_order::handler` in structure and error handling.
//!
//! # Routes
//! - GET  /purchases/purchase-invoices        → `list_purchase_invoices`
//! - GET  /purchases/purchase-invoices/{id}   → `get_purchase_invoice`
//! - POST /purchases/purchase-invoices        → `create_purchase_invoice`
use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Json,
};

use crate::modules::purchase_invoice::{
    dto::{
        query::PurchaseInvoicesListQuery,
        create::CreatePurchaseInvoiceDto,
        response::{PaginatedInvoicesResponse, PurchaseInvoiceDetailResponse},
    },
    service,
};

/// GET /purchases/purchase-invoices
///
/// Accepts optional query params: `search`, `filter`, `status`, `since`, `to`, `cursor`, `limit`.
/// Returns a paginated envelope with `data`, `nextCursor`, and `hasMore`.
pub async fn list_purchase_invoices(
    Query(query): Query<PurchaseInvoicesListQuery>,
) -> Result<Json<PaginatedInvoicesResponse>, StatusCode> {
    let result = service::list_purchase_invoices(query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(result))
}

/// GET /purchases/purchase-invoices/{id}
///
/// Returns full invoice detail including line items.
/// Returns 404 when no invoice with the given id exists.
pub async fn get_purchase_invoice(
    Path(id): Path<i32>,
) -> Result<Json<PurchaseInvoiceDetailResponse>, StatusCode> {
    let result = service::get_purchase_invoice(id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    match result {
        Some(invoice) => Ok(Json(invoice)),
        None          => Err(StatusCode::NOT_FOUND),
    }
}

/// POST /purchases/purchase-invoices
///
/// Creates a new invoice. Triggers stock and order quantity updates atomically.
/// Returns `{ "id": <new_id> }` on success.
pub async fn create_purchase_invoice(
    Json(payload): Json<CreatePurchaseInvoiceDto>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let id = service::create_purchase_invoice(payload)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(serde_json::json!({ "id": id })))
}