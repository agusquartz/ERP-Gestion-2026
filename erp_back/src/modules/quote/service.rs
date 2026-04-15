use crate::modules::quote::{
    dto::{
        create::CreateQuoteDto,
        response::QuoteResponseDto,
        update::PatchQuoteDto,
    },
    mapper,
    repository,
};
// ------------------------------------------------------------
// Service layer
// Responsibilities:
// - Business rules
// - Validation orchestration
// - Calling the repository
// - Using the mapper to build DTO responses
//
// The handler should stay thin, and the repository should only
// deal with SQL and data access.
// ------------------------------------------------------------

pub async fn create_quote(dto: CreateQuoteDto) -> Result<QuoteResponseDto, String> {
    // A quote should contain at least one detail
    if dto.details.is_empty() {
        return Err("Quote must contain at least one detail".to_string());
    }

    let quote_with_details = repository::create_quote(dto).await?;
    Ok(mapper::quote_with_details_to_response(quote_with_details))
}


pub async fn get_quotes(contains: Option<String>) -> Result<Vec<QuoteResponseDto>, String> {
    // If contains is provided, apply filtered search logic
    // Otherwise, return all quotes
    let quotes = repository::get_quotes(contains).await?;

    Ok(quotes
    .into_iter()
    .map(mapper::quote_with_details_to_response)
    .collect())
}


pub async fn get_quote_by_id(id: i32) -> Result<QuoteResponseDto, String> {
    // Load a single quote with client, status and details
    let quote = repository::get_quote_by_id(id).await?;
    Ok(mapper::quote_with_details_to_response(quote))
}


pub async fn patch_quote(id: i32, dto: PatchQuoteDto) -> Result<QuoteResponseDto, String> {
    // Update the quote using the provided optional fields
    let quote = repository::patch_quote(id, dto).await?;
    Ok(mapper::quote_with_details_to_response(quote))
}
