use chrono::NaiveDate;
use serde::Deserialize;

// ------------------------------------------------------------
// CreateQuoteDto
// This DTO defines the payload expected by POST /quotes.
// ------------------------------------------------------------

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateQuoteDto {
    // Client that owns the quote
    pub client_id: i32,

    // Initial status for the quote
    pub status_id: i32,

    // Quote creation date
    pub created_at: NaiveDate,

    // Quote line items
    pub details: Vec<CreateQuoteDetailDto>,
}


// ------------------------------------------------------------
// CreateQuoteDetailDto
// This DTO defines each line inside the quote payload.
// Each quote detail belongs only to quotes.
// ------------------------------------------------------------

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]

pub struct CreateQuoteDetailDto {
    // Product being quoted
    pub product_id: i32,

    // Quantity requested
    pub quantity: i32,
}
