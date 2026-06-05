//! # Quote HTTP Handlers
//!
//! This module contains the Axum handler functions bound to HTTP routes in
//! [`crate::modules::quote::router`].
//!
//! ## Responsibilities
//! - Extract data from the HTTP request (path params, query params, JSON body)
//! - Call the appropriate service function
//! - Translate service results into HTTP responses (status codes + JSON body)
//!
//! ## What handlers do NOT do
//! - Execute SQL (repository's job)
//! - Apply business logic or validation (service's job)
//! - Build or transform domain types (mapper's job)
//!
//! ## Return type pattern
//! All handlers return `Result<Json<T>, (StatusCode, String)>`, which Axum
//! automatically serializes as:
//! - `Ok(Json(data))` → HTTP 200 with JSON body
//! - `Err((status, message))` → HTTP `status` with a plain-text error body
//!
//! This is simpler than implementing `IntoResponse` manually and sufficient
//! for an internal API. For a public API, consider a structured error DTO.
//!
//! ## Automatic input validation
//! Axum's `Json<T>` extractor runs serde deserialization before the handler body
//! executes. If the request body is malformed or missing a required field, Axum
//! returns `422 Unprocessable Entity` automatically — the handler is never called.

use axum::{
    Json, 
    extract::{Path, Query},
    http::StatusCode,
};
use std::collections::HashMap;
use crate::modules::quote::service;
use crate::modules::quote::dto::{
    QuoteListQuery,
    create::CreateQuoteDto,
    response::{
        QuoteResponseDto,
        ListQuotesView,
    }
};


/// `POST /quotes`
///
/// Creates a new quote from the JSON body and returns the fully populated quote.
///
/// Axum deserializes the request body into [`CreateQuoteDto`] before this handler
/// runs. If deserialization fails, Axum returns `422` automatically.
///
/// ## Error mapping
/// Any service or repository error (including the "empty details" business rule)
/// is returned as `400 Bad Request` with the error message as the body.
/// This is intentionally broad — consider mapping `DbError` variants to more
/// specific status codes (e.g. `NotFound` → 404, `Other` → 400) in a future refactor.
///
/// # Request Body
/// [`CreateQuoteDto`] serialized as JSON (`camelCase` keys).
///
/// # Responses
/// - `200 OK` with [`QuoteResponseDto`] as JSON body
/// - `400 Bad Request` with error message string if creation fails
/// - `422 Unprocessable Entity` if the request body is malformed (handled by Axum)

pub async fn create_quote_handler(
    Json(payload): Json<CreateQuoteDto>,
) -> Result<Json<QuoteResponseDto>, (StatusCode, String)> {

    match service::create_quote(payload).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
             StatusCode::BAD_REQUEST,
            e.to_string(),
        ))    
    }
}

/// `GET /quotes/{id}`
///
/// Returns the quote with the given `id`, including all its line items.
/// The `id` is extracted from the URL path by Axum's `Path<i32>` extractor.
///
/// ## Error mapping
/// Any service or repository error (including `DbError::NotFound`) is returned
/// as `404 Not Found`. For a stricter implementation, `NotFound` should map to
/// 404 and unexpected DB errors should map to 500.
///
/// # Path Parameters
/// - `id`: The quote's primary key (integer).
///
/// # Responses
/// - `200 OK` with [`QuoteResponseDto`] as JSON body
/// - `404 Not Found` with error message if the quote does not exist or any error occurs

pub async fn get_quote_handler(
    Path(id): Path<i32>,
) -> Result<Json<QuoteResponseDto>, (StatusCode, String)> {

    match service::get_quote_by_id(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::NOT_FOUND,
            e.to_string(),
        )),
    }

}

/// `GET /quotes` and `GET /quotes?contains=xxx`
///
/// Returns a JSON array of all quotes. If the `contains` query parameter is
/// provided, only quotes whose client name, surname, document, or quote ID
/// contains the substring (case-insensitive) are returned.
///
/// ## Query parameter extraction
/// Uses `HashMap<String, String>` instead of a typed struct to keep this handler
/// flexible. The `contains` key is extracted manually via `.get("contains")`.
/// An alternative would be a dedicated `QuoteQuery { contains: Option<String> }`
/// struct with `Query<QuoteQuery>`, which is more explicit and self-documenting.
///
/// ## Error mapping
/// Errors are returned as `500 Internal Server Error` because a failure in a
/// list query is almost always an unexpected database issue rather than a
/// client mistake.
///
/// # Query Parameters
/// - `contains` (optional): Substring filter applied to client name, surname,
///   document number, and quote ID.
///
/// # Responses
/// - `200 OK` with `Vec<QuoteResponseDto>` as JSON body (may be empty array)
/// - `500 Internal Server Error` with error message if the query fails

pub async fn list_quotes_handler(
    Query(query): Query<QuoteListQuery> 
) -> Result<Json<ListQuotesView>, (StatusCode, String)> {

    match service::get_quotes(query).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            e.to_string(),
        )),
   }
}
