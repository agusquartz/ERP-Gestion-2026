//! # Client HTTP Handlers
//!
//! This module contains the Axum handler functions that are bound to HTTP routes
//! in [`crate::modules::client::router`].
//!
//! ## Responsibilities
//! - Extract data from the HTTP request (path params, query params, JSON body)
//! - Call the appropriate service function
//! - Translate the service result into an HTTP response (status code + JSON body)
//!
//! ## What handlers do NOT do
//! - Execute SQL (that's the repository's job)
//! - Apply business logic (that's the service's job)
//! - Build or validate DTOs beyond what serde/Axum provide automatically
//!
//! ## Error handling
//! All handlers follow the same pattern:
//! - `Ok(value)`        → serialize `value` as JSON with an appropriate 2xx status
//! - `Ok(None)`         → 404 Not Found (resource doesn't exist)
//! - `Err(e)`           → log the error and return 500 Internal Server Error
//!
//! Errors are printed with `eprintln!` for now. In production this should be
//! replaced with a structured logging library (e.g. `tracing`).
 

use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};

use serde::Deserialize;
use crate::modules::client::dto::create::CreateClientDto;
use crate::modules::client::dto::update::PatchClientDto;
use crate::modules::client::service;


// ─────────────────────────────────────────────────────────────────────────────
// Query parameter extractor
// ─────────────────────────────────────────────────────────────────────────────
 
/// Query string parameters accepted by `GET /clients`.
///
/// Axum's `Query<T>` extractor deserializes the URL query string into this struct.
/// All fields are `Option` so that missing parameters result in `None` rather
/// than a 400 Bad Request error.
///
/// # Example URLs
/// - `GET /clients`                → `contains: None`  (returns all)
/// - `GET /clients?contains=john`  → `contains: Some("john")` (filtered)

#[derive(Deserialize)]
pub struct ClientQuery {
    /// Optional substring to filter clients by name or surname (case-insensitive).
    pub contains: Option<String>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────
 
/// `GET /clients` and `GET /clients?contains=xxx`
///
/// Returns a JSON array of all clients. If the `contains` query parameter is
/// provided, only clients whose name or surname matches the substring are returned.
/// Both cases are handled by a single handler using `ClientQuery`.
///
/// # Responses
/// - `200 OK` with `Vec<ClientResponseDto>` as JSON body (may be an empty array)
/// - `500 Internal Server Error` if the database query fails


pub async fn get_clients(
    Query(params): Query<ClientQuery>,
) -> impl IntoResponse {
    match service::get_clients(params.contains).await {
        Ok(clients) => (StatusCode::OK, Json(clients)).into_response(),
        Err(e) => {
            eprintln!("Error: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

/// `GET /clients/{id}`
///
/// Returns the client with the given `id`, including their phone numbers.
/// The `id` is extracted from the URL path by Axum's `Path<i32>` extractor.
///
/// # Path Parameters
/// - `id`: The client's primary key (integer).
///
/// # Responses
/// - `200 OK` with `ClientResponseDto` as JSON body
/// - `404 Not Found` if no client with this `id` exists
/// - `500 Internal Server Error` if the database query fails


pub async fn get_client_by_id(
    Path(id): Path<i32>,
) -> impl IntoResponse {
    match service::get_client_by_id(id).await {
        Ok(Some(client)) => (StatusCode::OK, Json(client)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(), 
        Err(e) => {
            eprintln!("Error: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

/// `POST /clients`
///
/// Creates a new client along with any phone numbers included in the request body.
/// The request body is deserialized into a [`CreateClientDto`] by Axum's `Json<T>`
/// extractor. If deserialization fails (missing required field, wrong type), Axum
/// automatically returns `422 Unprocessable Entity` before this handler runs.
///
/// # Request Body
/// `CreateClientDto` serialized as JSON (camelCase keys).
///
/// # Responses
/// - `201 Created` with the new `ClientResponseDto` as JSON body
/// - `422 Unprocessable Entity` if the request body is malformed (handled by Axum)
/// - `500 Internal Server Error` if the insert transaction fails


pub async fn create_client(
    Json(dto): Json<CreateClientDto>,
) -> impl IntoResponse {
    match service::create_client(dto).await {
        Ok(client) => (StatusCode::CREATED, Json(client)).into_response(),
        Err(e) => {
            eprintln!("Error: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}


/// `PATCH /clients/{id}`
///
/// Partially updates a client. Only the fields present in the JSON body are
/// modified; absent fields retain their current database values.
/// If the `phones` array is included, all existing phone associations are
/// replaced with the new list.
///
/// # Path Parameters
/// - `id`: The client's primary key (integer).
///
/// # Request Body
/// `PatchClientDto` serialized as JSON. All fields are optional.
///
/// # Responses
/// - `200 OK` with the updated `ClientResponseDto` as JSON body
/// - `404 Not Found` if no client with this `id` exists
/// - `422 Unprocessable Entity` if the request body is malformed (handled by Axum)
/// - `500 Internal Server Error` if the update transaction fails


pub async fn patch_client(
    Path(id): Path<i32>,
    Json(dto): Json<PatchClientDto>,
) -> impl IntoResponse {
    match service::patch_client(id, dto).await {
        Ok(Some(client)) => (StatusCode::OK, Json(client)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(), 
        Err(e) => {
            eprintln!("Error: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}
