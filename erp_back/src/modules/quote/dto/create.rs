//! Create Quote DTO
//!
//! Represents data received from HTTP requests.
//!
//! Responsibilities:
//! - Validate input shape (NOT business logic)
//! - Transport data from handler → service

use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateQuoteDto {
    pub client_id: i32,
    pub status_id: i32,
    pub created_at: String,

    pub details: Vec<CreateQuoteDetailDto>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateQuoteDetailDto {
    pub product_id: i32,
    pub unit_cost: f64,
    pub tax: f64,
    pub quantity: i32,
}
