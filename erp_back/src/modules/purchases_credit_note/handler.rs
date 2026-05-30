use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Json,
};
use serde::Deserialize;

use crate::modules::purchases_credit_note::{
    dto::{
        PurchaseCreditNoteListQuery,
        response::{
            ListPurchaseCreditNoteView,
            CreditNoteResponse,
        },
        create::CreateCreditNoteDto,
    },
    service,
    errors,
};

/// HTTP handler for listing credit notes with optional text filtering.
///
/// Endpoint:
/// - GET /purchases/supplier-credit-notes
pub async fn list_credit_note(
    Query(query): Query<PurchaseCreditNoteListQuery>,
) -> Result<Json<ListPurchaseCreditNoteView>, StatusCode> {
    let result = service::list_credit_notes(query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
    Ok(Json(result))
}

/// HTTP handler for retrieving a single credit note by its database identifier.
///
/// Endpoint:
/// - GET /purchases/supplier-credit-notes/{id}
pub async fn get_credit_note(
    Path(id): Path<i32>,
) -> Result<Json<CreditNoteResponse>, StatusCode> {
    let result = service::get_credit_note(id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match result {
        Some(credit_note) => Ok(Json(credit_note)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// HTTP handler for executing and creating a new supplier credit note.
///
/// Endpoint:
/// - POST /purchases/supplier-credit-notes
///
/// Error Mapping:
/// - Catches validation errors (like a missing product) and outputs 400 Bad Request
/// - Any other structural or DB layer issues fallback to 500 Internal Server Error
pub async fn create_credit_note(
    Json(payload): Json<CreateCreditNoteDto>,
) -> Result<Json<CreditNoteResponse>, StatusCode> {
    let credit_note = service::create_credit_note(payload)
        .await
        .map_err(|err| match err {
            errors::ServiceError::Validation(_) => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        })?;

    Ok(Json(credit_note))
}

