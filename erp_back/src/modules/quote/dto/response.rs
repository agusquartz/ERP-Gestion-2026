//! Quote Response DTO
//!
//! This is what the API returns to the client.
//! It is independent of database schema.

use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteResponseDto {
    pub id: i32,
    pub created_at: String,
    pub status: QuoteStatusResponseDto,
    pub total: f64,
    pub client: QuoteClientResponseDto,
    pub details: Vec<QuoteDetailResponseDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuoteStatusResponseDto {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuoteClientResponseDto {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub document: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuoteProductResponseDto {
    pub id: i32,
    pub description: String,
    pub code: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuoteDetailResponseDto {
    pub product: QuoteProductResponseDto,
    pub unit_cost: f64,
    pub tax: f64,
    pub quantity: i32,
    pub subtotal: f64,
}
