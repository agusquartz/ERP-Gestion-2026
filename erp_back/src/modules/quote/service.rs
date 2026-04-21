//! # Quote Service Layer
//!
//! This module sits between the HTTP handlers and the repository.
//! It is the **home of business logic** for the quote domain.
//!
//! ## Responsibilities
//! - Validate business rules before calling the repository
//! - Orchestrate repository calls (one or more per operation)
//! - Map repository results to response DTOs via the mapper layer
//! - Translate `DbError::NotFound` into meaningful errors for the handler
//!
//! ## What this module does NOT do
//! - Execute SQL (that is the repository's job)
//! - Interact with HTTP types like `StatusCode` or `Json` (that is the handler's job)
//! - Build or format JSON (that is the DTO/mapper's job)
//!
//! ## Error handling
//! All functions return `Result<_, DbError>`. The handler layer maps specific
//! `DbError` variants to HTTP status codes (e.g. `NotFound` → 404, `Other` → 400).
 
use crate::modules::quote::{
    dto::response::QuoteResponseDto,
    dto::create::CreateQuoteDto,
    repository,
    mapper,
};

use crate::db_config::DbError;


/// Creates a new quote and returns it as a response DTO.
///
/// ## Business validation
/// Rejects the request if `dto.details` is empty — a quote with no line items
/// has no business meaning and should never reach the database.
/// This check is also performed in the repository as a defensive guard, but
/// enforcing it here keeps the service authoritative for business rules.
///
/// ## Flow
/// 1. Validate that `details` is non-empty.
/// 2. Delegate to [`repository::create_quote`], which runs the full insert transaction
///    (quote header → detail lines → total update → re-fetch).
/// 3. Map the returned [`QuoteWithDetails`] aggregate to a [`QuoteResponseDto`]
///    via [`mapper::quote_with_details_to_response`].
///
/// # Parameters
/// - `dto`: The deserialized create payload from the HTTP request body.
///
/// # Returns
/// - `Ok(QuoteResponseDto)`: The newly created quote with all fields populated.
/// - `Err(DbError::Other(...))`: If `details` is empty.
/// - `Err(DbError)`: If the repository transaction fails.

pub async fn create_quote(
    dto: CreateQuoteDto,
) -> Result<QuoteResponseDto, crate::db_config::DbError> {

    // Business rule: a quote must have at least one line item.
    // Enforced here (not just in the repository) to keep validation at the
    // service layer where business rules belong

    if dto.details.is_empty() {
        return Err(DbError::Other(
        "Quote must contain at least one detail".to_string()
        ));
    }

    let quote = repository::create_quote(dto).await?;

    Ok(mapper::quote_with_details_to_response(quote))
}

/// Retrieves a single quote by its primary key and returns it as a response DTO.
///
/// Converts `Ok(None)` from the repository (quote not found) into
/// `Err(DbError::NotFound)`, which the handler maps to HTTP 404.
///
/// ## Flow
/// 1. Call [`repository::get_quote_by_id`].
/// 2. Convert `None` → `Err(DbError::NotFound)` via `.ok_or(...)`.
/// 3. Map the aggregate to a DTO.
///
/// # Parameters
/// - `id`: The primary key of the quote to retrieve.
///
/// # Returns
/// - `Ok(QuoteResponseDto)`: Quote found and mapped.
/// - `Err(DbError::NotFound)`: No quote with this `id` exists.
/// - `Err(DbError)`: Database query failed.

pub async fn get_quote_by_id(id: i32) -> Result<QuoteResponseDto, crate::db_config::DbError> {
    let quote = repository::get_quote_by_id(id).await?
        .ok_or(DbError::NotFound)?;     // Converts Option::None → Err(NotFound)

    Ok(mapper::quote_with_details_to_response(quote))
}

/// Retrieves all quotes, with an optional substring filter, and returns them
/// as a list of response DTOs.
///
/// When `contains` is `Some(...)`, the repository applies a case-insensitive
/// (`ILIKE`) filter across client name, surname, document, and quote ID.
///
/// ## Flow
/// 1. Delegate to [`repository::get_quotes`] with the optional filter.
/// 2. Map each [`QuoteWithDetails`] aggregate to a [`QuoteResponseDto`] using
///    [`mapper::quote_with_details_to_response`] via `.map(...)`.
///
/// # Parameters
/// - `contains`: Optional search string. `None` returns all quotes.
///
/// # Returns
/// - `Ok(Vec<QuoteResponseDto>)`: Possibly empty list of matching quotes.
/// - `Err(DbError)`: Database query failed.

pub async fn get_quotes(
    contains: Option<String>,
) -> Result<Vec<QuoteResponseDto>, crate::db_config::DbError> {

    let quotes = repository::get_quotes(contains).await?;

    Ok(quotes
        .into_iter()
        .map(mapper::quote_with_details_to_response)    // Map each aggregate to DTO
        .collect())
}
