//! Invoice HTTP handlers
//!
//! This module defines the HTTP entry points for invoice-related operations.
//! It acts as the boundary between the HTTP layer and the service layer.
//!
//! # Responsibilities
//! - Extract request data (path, query, JSON)
//! - Call service layer functions
//! - Map results into HTTP responses
//!
//! # Non-responsibilities
//! - No business logic
//! - No database interaction
//! - No data transformation beyond simple wrapping
use axum::{
    extract::{Path,Query},
    http::StatusCode,
    Json,
};

use crate::modules::invoice::dto::{InvoiceListQuery, response::InvoiceResponse, create::CreateInvoiceDto};
use crate::modules::invoice::service;

/// Retrieves a list of invoices.
///
/// # Endpoint
/// GET /invoices  
/// GET /invoices?contains=string
///
/// # Query Parameters
/// - `contains`: optional filter string
pub async fn list_invoices(
    Query(query): Query<InvoiceListQuery>,
) -> Result<Json<Vec<InvoiceResponse>>,StatusCode> {
    let result = service::list_invoices(query.contains).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(result))
}

/// Retrieves a single invoice by ID.
///
/// # Endpoint
/// GET /invoices/:id
///
/// # Returns
/// - 200 with invoice if found
/// - 404 if not found
pub async fn get_invoice(
    Path(id): Path<i32>
) -> Result<Json<InvoiceResponse>, StatusCode> {
    let result= service::get_invoice(id).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    match result {
        Some(result) => Ok(Json(result)),
        None => Err(StatusCode::NOT_FOUND)
    }
}

/// Creates a new invoice.
///
/// # Endpoint
/// POST /invoices
///
/// # Body
/// JSON `CreateInvoiceDto`
///
/// # Returns
/// - 200 with created invoice
pub async fn create_invoice(
    Json(payload): Json<CreateInvoiceDto>,
) -> Result<Json<InvoiceResponse>, StatusCode> {
    let invoice = service::create_invoice(payload)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(invoice))
}
