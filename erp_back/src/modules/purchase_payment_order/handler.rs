//! # Purchase Payment Order HTTP Handlers
//!
//! This module contains the Axum handler functions bound to HTTP routes in
//! [`crate::modules::purchase_payment_order::router`].
//!
//! ## Responsibilities
//! - Extract data from HTTP requests.
//! - Call the purchase payment order service layer.
//! - Translate service results into HTTP responses.
//!
//! ## What handlers do NOT do
//! - Execute SQL — repository's job.
//! - Apply business rules — service's job.
//! - Transform domain models — mapper's job.
//!
//! ## Return type pattern
//! All handlers return `Result<Json<T>, (StatusCode, String)>`, which Axum
//! automatically serializes as:
//! - `Ok(Json(data))` → HTTP 200 with JSON body.
//! - `Err((status, message))` → HTTP error status with a plain-text message.

use axum::{
    Json,
    extract::{Path, Query},
    http::StatusCode,
};

use std::collections::HashMap;

use crate::db_config::DbError;

use crate::modules::purchase_payment_order::service;

use crate::modules::purchase_payment_order::dto::{
    create::CreatePurchasePaymentOrderDto,
    response::PurchasePaymentOrderResponseDto,
    update::{
        UpdatePurchasePaymentOrderStatusDto,
        ApprovePurchasePaymentOrderDto,
    },
};

/// `POST /purchase-payment-orders`
///
/// Creates a new purchase payment order from the JSON body and returns the
/// fully populated payment order.
///
/// Axum deserializes the request body into [`CreatePurchasePaymentOrderDto`]
/// before this handler runs. If deserialization fails, Axum returns `422`
/// automatically.
///
/// # Request Body
/// [`CreatePurchasePaymentOrderDto`] serialized as JSON with camelCase keys.
///
/// # Responses
/// - `200 OK` with [`PurchasePaymentOrderResponseDto`] as JSON body.
/// - `400 Bad Request` if business validation fails.
/// - `422 Unprocessable Entity` if the JSON body is malformed.
pub async fn create_purchase_payment_order_handler(
    Json(payload): Json<CreatePurchasePaymentOrderDto>,
) -> Result<Json<PurchasePaymentOrderResponseDto>, (StatusCode, String)> {
    match service::create_purchase_payment_order(payload).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_create_error(e)),
    }
}

/// `GET /purchase-payment-orders/{id}`
///
/// Returns a single purchase payment order by ID, including its invoice details.
///
/// # Path Parameters
/// - `id`: Primary key of the purchase payment order.
///
/// # Responses
/// - `200 OK` with [`PurchasePaymentOrderResponseDto`] as JSON body.
/// - `404 Not Found` if the payment order does not exist.
/// - `500 Internal Server Error` if an unexpected database error occurs.
pub async fn get_purchase_payment_order_handler(
    Path(id): Path<i32>,
) -> Result<Json<PurchasePaymentOrderResponseDto>, (StatusCode, String)> {
    match service::get_purchase_payment_order_by_id(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

/// `GET /purchase-payment-orders` and
/// `GET /purchase-payment-orders?contains=xxx`
///
/// Returns all purchase payment orders. If `contains` is provided, the
/// repository applies a case-insensitive search.
///
/// The filter may match values such as:
/// - payment order ID
/// - supplier name
/// - status name
/// - requester/approver name
/// - invoice number
///
/// # Query Parameters
/// - `contains` optional text filter.
///
/// # Responses
/// - `200 OK` with `Vec<PurchasePaymentOrderResponseDto>`.
/// - `500 Internal Server Error` if the query fails.
pub async fn list_purchase_payment_orders_handler(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<PurchasePaymentOrderResponseDto>>, (StatusCode, String)> {
    let contains = params.get("contains").cloned();

    match service::get_purchase_payment_orders(contains).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            e.to_string(),
        )),
    }
}

/// `PATCH /purchase-payment-orders/{id}/status`
///
/// Updates only the workflow status of a purchase payment order.
///
/// This endpoint is useful for generic transitions such as:
/// - pending → cancelled
/// - approved → paid
/// - pending → rejected
///
/// # Path Parameters
/// - `id`: Primary key of the purchase payment order.
///
/// # Request Body
/// [`UpdatePurchasePaymentOrderStatusDto`] serialized as JSON.
///
/// # Responses
/// - `200 OK` with updated [`PurchasePaymentOrderResponseDto`].
/// - `400 Bad Request` if `statusId` is invalid.
/// - `404 Not Found` if the payment order does not exist.
pub async fn update_purchase_payment_order_status_handler(
    Path(id): Path<i32>,
    Json(payload): Json<UpdatePurchasePaymentOrderStatusDto>,
) -> Result<Json<PurchasePaymentOrderResponseDto>, (StatusCode, String)> {
    match service::update_purchase_payment_order_status(id, payload.status_id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_update_error(e)),
    }
}

/// `PATCH /purchase-payment-orders/{id}/approve`
///
/// Approves a purchase payment order.
///
/// This endpoint sets:
/// - `approved_by_employee_id`
/// - `status_id`
///
/// The `approvedStatusId` should be the ID of the status that represents
/// `"Approved"` in your `statuses` table.
///
/// # Path Parameters
/// - `id`: Primary key of the purchase payment order.
///
/// # Request Body
/// [`ApprovePurchasePaymentOrderDto`] serialized as JSON.
///
/// # Responses
/// - `200 OK` with updated [`PurchasePaymentOrderResponseDto`].
/// - `400 Bad Request` if the payload is invalid.
/// - `404 Not Found` if the payment order does not exist.
pub async fn approve_purchase_payment_order_handler(
    Path(id): Path<i32>,
    Json(payload): Json<ApprovePurchasePaymentOrderDto>,
) -> Result<Json<PurchasePaymentOrderResponseDto>, (StatusCode, String)> {
    match service::approve_purchase_payment_order(
        id,
        payload.approved_by_employee_id,
        payload.approved_status_id,
    )
    .await
    {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_update_error(e)),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR MAPPING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/// Maps errors produced during create operations.
fn map_create_error(error: DbError) -> (StatusCode, String) {
    match error {
        DbError::NotFound => (
            StatusCode::NOT_FOUND,
            error.to_string(),
        ),
        DbError::Other(_) => (
            StatusCode::BAD_REQUEST,
            error.to_string(),
        ),
        _ => (
            StatusCode::BAD_REQUEST,
            error.to_string(),
        ),
    }
}

/// Maps errors produced during read-by-id operations.
fn map_read_error(error: DbError) -> (StatusCode, String) {
    match error {
        DbError::NotFound => (
            StatusCode::NOT_FOUND,
            error.to_string(),
        ),
        _ => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error.to_string(),
        ),
    }
}

/// Maps errors produced during update operations.
fn map_update_error(error: DbError) -> (StatusCode, String) {
    match error {
        DbError::NotFound => (
            StatusCode::NOT_FOUND,
            error.to_string(),
        ),
        DbError::Other(_) => (
            StatusCode::BAD_REQUEST,
            error.to_string(),
        ),
        _ => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error.to_string(),
        ),
    }
}