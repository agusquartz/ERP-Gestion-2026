use axum::{
    extract::{Path,Query},
    http::StatusCode,
    Json,
};

use crate::modules::credit_notes::dto::{
    CreditNoteListQuery, 
    response::{ 
        CreditNoteResponse, 
        ListCreditNotesView,
    },
    create::CreateCreditNoteDto
};
use crate::modules::credit_notes::service;

/// # Query Parameters
/// - `contains`: optional filter string
pub async fn list_credit_notes(
    Query(query): Query<CreditNoteListQuery>,
) -> Result<Json<ListCreditNotesView>,(StatusCode, String)> {
    let result = service::list_credit_notes(query).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(result))
}

/// Retrieves a single credit_note by ID.
///
/// # Endpoint
/// GET /credit-notes/{id}
///
/// # Returns
/// - 200 with invoice if found
/// - 404 if not found
pub async fn get_credit_note(
    Path(id): Path<i32>
) -> Result<Json<CreditNoteResponse>, StatusCode> {
    let result= service::get_credit_note(id).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    match result {
        Some(result) => Ok(Json(result)),
        None => Err(StatusCode::NOT_FOUND)
    }
}

/// Creates a new credit note.
///
/// # Endpoint
/// POST /credit-notes
///
/// # Body
/// JSON `CreateCreditNoteDto`
///
/// # Returns
/// - 200 with created invoice
pub async fn create_credit_note(
    Json(payload): Json<CreateCreditNoteDto>,
) -> Result<Json<CreditNoteResponse>, StatusCode> {
    let credit_note = service::create_credit_note(payload)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(credit_note))
}
