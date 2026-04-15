//! Quote Service Layer
//!
//! Responsibilities:
//! - Business validation
//! - Orchestration of repository calls
//! - Mapping via mapper
//!
//! NO SQL, NO HTTP

use crate::modules::quote::{
    dto::response::QuoteResponseDto,
    repository,
    mapper,
};

pub async fn create_quote(
    dto: CreateQuoteDto,
) -> Result<QuoteResponseDto, String> {

    if dto.details.is_empty() {
        return Err("Quote must contain at least one detail".to_string());
    }

    let quote = repository::create_quote(dto).await?;

    Ok(mapper::quote_with_details_to_response(quote))
}


/// Get quote by id
pub async fn get_quote_by_id(id: i32) -> Result<QuoteResponseDto, String> {
    let quote = repository::get_quote_by_id(id).await?
        .ok_or("Quote not found".to_string())?;

    Ok(mapper::quote_with_details_to_response(quote))
}

//! Get list of quotes
pub async fn get_quotes(
    contains: Option<String>,
) -> Result<Vec<QuoteResponseDto>, String> {

    let quotes = repository::get_quotes(contains.as_deref()).await?;

    Ok(quotes
        .into_iter()
        .map(mapper::quote_with_details_to_response)
        .collect())
}
