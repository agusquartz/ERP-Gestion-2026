use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Json,
    response::{IntoResponse, Response},
};

use serde::Serialize;

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

#[derive(Serialize)]
struct ApiErrorResponse {
    code: &'static str,
    message: String,
    product_id: Option<i32>,
}

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
) -> Result<Json<CreditNoteResponse>, Response> {
    let credit_note = service::create_credit_note(payload)
        .await
        .map_err(map_service_error)?;

    Ok(Json(credit_note))
}






fn map_service_error(err: errors::ServiceError) -> Response {
    match err {
        errors::ServiceError::InsufficientStock(stock_err) => {
            let body = ApiErrorResponse {
                code: "INSUFFICIENT_STOCK",
                message: format!(
                    "Insufficient stock for product ID {}",
                    stock_err.product_id
                ),
                product_id: Some(stock_err.product_id),
            };

            (StatusCode::CONFLICT, Json(body)).into_response()
        }

        errors::ServiceError::Validation(validation_err) => {
            let body = ApiErrorResponse {
                code: "VALIDATION_ERROR",
                message: validation_err.context,
                product_id: None,
            };

            (StatusCode::BAD_REQUEST, Json(body)).into_response()
        }

        errors::ServiceError::NotFound(context) => {
            let message = match context.id {
                Some(id) => format!("{} with id {} doesn't exist", context.entity, id),
                None => format!("{} doesn't exist", context.entity),
            };

            let body = ApiErrorResponse {
                code: "NOT_FOUND",
                message,
                product_id: None,
            };

            (StatusCode::NOT_FOUND, Json(body)).into_response()
        }

        errors::ServiceError::Dependency(dep_err) => {
            let body = ApiErrorResponse {
                code: "DEPENDENCY_ERROR",
                message: format!(
                    "{} system has failed, because: {}",
                    dep_err.system,
                    dep_err.message
                ),
                product_id: None,
            };

            (StatusCode::INTERNAL_SERVER_ERROR, Json(body)).into_response()
        }

        errors::ServiceError::Database(db_err) => {
            eprintln!("Database error creating credit note: {:?}", db_err);

            let body = ApiErrorResponse {
                code: "DATABASE_ERROR",
                message: "Internal database error".to_string(),
                product_id: None,
            };

            (StatusCode::INTERNAL_SERVER_ERROR, Json(body)).into_response()
        }
    }
}