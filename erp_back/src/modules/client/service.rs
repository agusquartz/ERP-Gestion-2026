//! # Client Service Layer
//!
//! This module sits between the HTTP handlers and the repository.
//! Its responsibilities are:
//!
//! - **Orchestration**: Calls one or more repository functions and composes results.
//! - **Mapping**: Converts internal `ClientAggregate` model types into public-facing
//!   `ClientResponseDto` types before returning them to the handler.
//! - **Error unification**: Wraps `DbError` into `ServiceError` so that the handler
//!   only needs to handle one error type regardless of what went wrong underneath.
//! - **Business logic** (future): Validation, authorization checks, computed fields,
//!   or cross-module side effects would live here — not in the handler or repository.
//!
//! ## Why this layer exists
//! Handlers should only deal with HTTP concerns (status codes, JSON extraction).
//! Repositories should only deal with SQL concerns. The service layer is the
//! boundary that keeps both clean and independently testable.

use crate::modules::client::{
    dto::{
        ClientListQuery,
        create::CreateClientDto,
        response::{
            ClientResponseDto,
            ListClientView,
        },
        update::PatchClientDto, 
    },
    model::ClientAggregate,
    repository,
};
use crate::shared::db_config;


// ─────────────────────────────────────────────────────────────────────────────
// Error type
// ─────────────────────────────────────────────────────────────────────────────

/// Unified error type for the client service layer.
///
/// Wraps lower-level errors into a single type so that handlers only need
/// to `match` or `map_err` on `ServiceError`, regardless of the underlying cause.
///
/// Currently has two variants:
/// - `Db`: A database error propagated from the repository.
/// - `Validation`: A business rule violation (e.g. duplicate document, invalid email format).
///   Not yet used in the current implementation but reserved for future validation logic.
#[derive(Debug)]
pub enum ServiceError {
    /// Wraps a database-level error from `tokio_postgres`.
    Db(db_config::DbError),

    /// A business rule validation failure. The inner `String` contains a
    /// human-readable description of the violated rule.
    Validation(String),
}


/// Allows using `?` on repository calls that return `Result<_, DbError>`.
///
/// Without this, every repository call would need `.map_err(ServiceError::Db)?`.
/// With this `From` impl, the `?` operator converts automatically.
impl From<db_config::DbError> for ServiceError {
    fn from(value: db_config::DbError) -> Self {
        Self::Db(value)
    }
}   


/// Human-readable display for logs and error messages.
///
/// Intentionally vague for `Db` errors to avoid leaking internal details
/// (e.g. table names, column names) into log outputs that may be exposed.
impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::Db(_) => write!(f, "database error"), 
            ServiceError::Validation(msg) => write!(f, "validation error: {msg}"),
        }
    } 
}


/// Marks `ServiceError` as a standard Rust error, enabling it to be used
/// with error-handling utilities like `anyhow` or `thiserror` in the future,
/// and to be boxed as `Box<dyn std::error::Error>` if needed.
impl std::error::Error for ServiceError {}



// ─────────────────────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────────────────────

/// Returns all clients, optionally filtered by a name/surname substring.
///
/// Delegates to [`repository::query_clients`] and maps each result to a
/// [`ClientResponseDto`] using the `Into` trait (via `From<ClientAggregate>`).
///
/// # Parameters
/// - `contains`: Optional search term. If `Some("alice")`, only clients whose
///   name or surname contains "alice" (case-insensitive) are returned.
///   If `None`, all clients are returned.
///
/// # Returns
/// - `Ok(Vec<ClientResponseDto>)`: Possibly empty list of matching clients.
/// - `Err(ServiceError::Db(...))`: Database query failed.
pub async fn get_clients(
    query: ClientListQuery
) -> Result<ListClientView, ServiceError> {
    let rows= repository::query_clients(
        query.search, 
        query.filter, 
        query.since, 
        query.to, 
        query.status, 
        query.cursor, 
        query.limit + 1,
    ).await?;

    let mut clients: Vec<ClientResponseDto> = rows.into_iter().map(Into::into).collect();

    let limit = query.limit as usize;

    let has_more = clients.len() > limit; 

    clients.truncate(limit);

    let view = ListClientView {
        clients: clients,
        has_more: has_more,
    };

    Ok(view)
}


/// Returns a single client by their primary key, or `None` if not found.
///
/// The `None` case is intentionally distinct from an error — the handler
/// uses it to return HTTP 404 without logging an error.
///
/// # Parameters
/// - `id`: The client's database primary key.
///
/// # Returns
/// - `Ok(Some(ClientResponseDto))`: Client found and mapped.
/// - `Ok(None)`: No client with this `id` exists.
/// - `Err(ServiceError::Db(...))`: Database query failed.

pub async fn get_client_by_id(
    id: i32,
) -> Result<Option<ClientResponseDto>, ServiceError> {
    let result = repository::query_client_by_id(id).await?;
    Ok(result.map(Into::into))
}


/// Creates a new client with their associated phone numbers.
///
/// Delegates to [`repository::insert_client`], which runs a multi-step
/// transaction. On success, the fully populated client aggregate is mapped
/// to a DTO and returned.
///
/// # Parameters
/// - `dto`: Validated create payload from the request body.
///
/// # Returns
/// - `Ok(ClientResponseDto)`: The newly created client with all fields populated.
/// - `Err(ServiceError::Db(...))`: Transaction or insert failed.

pub async fn create_client(
    dto: CreateClientDto,
) -> Result<ClientResponseDto, ServiceError> {
    let result = repository::insert_client(&dto).await?;
    Ok(Into::into(result))
}


/// Partially updates an existing client, including optional phone replacement.
///
/// Only fields present in `dto` (i.e., `Some(...)`) are applied.
/// Returns `None` (not an error) when the target client does not exist.
///
/// # Parameters
/// - `id`: The primary key of the client to update.
/// - `dto`: Partial update payload. `None` fields are ignored.
///
/// # Returns
/// - `Ok(Some(ClientResponseDto))`: Update succeeded; returns the new state.
/// - `Ok(None)`: No client with this `id` exists (triggers HTTP 404).
/// - `Err(ServiceError::Db(...))`: Transaction or update failed
pub async fn patch_client(
    id: i32,
    dto: PatchClientDto,
) -> Result<Option<ClientResponseDto>, ServiceError> {
    let result = repository::patch_client(id, &dto).await?;
    Ok(result.map(Into::into))
}
