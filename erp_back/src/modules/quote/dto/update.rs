use chrono::NaiveDate;
use serde::Deserialize;

// ------------------------------------------------------------
// PatchQuoteDto
// This DTO defines the payload expected by PATCH /quotes/:id.
// All fields are optional because PATCH is partial.
// ------------------------------------------------------------

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchQuoteDto {
    pub client_id: Option<i32>,
    pub status_id: Option<i32>,
    pub created_at: Option<NaiveDate>,
    pub details: Option<Vec<PatchQuoteDetailDto>>,
}

// ------------------------------------------------------------
// PatchQuoteDetailDto
// This DTO is used when quote details are replaced.
// The list is optional, but each item must be valid.
// ------------------------------------------------------------

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchQuoteDetailDto {
    pub product_id: i32,
    pub quantity: i32,
}
