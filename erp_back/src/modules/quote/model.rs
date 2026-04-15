use serde::{Deserialize, Serialize};
use chrono::NaiveDate;

// ------------------------------------------------------------
// Internal domain models
// These models represent how the data exists inside the backend.
// They are not the public API contract.
// ------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Quote {
    pub id: i32,
    pub client_id: i32,
    pub status_id: i32,
    pub created_at: NaiveDate,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuoteWithDetails {
    // Main quote information
    pub quote: Quote,

    // Client information needed in the response
    pub client: QuoteClient,

    // Status information needed int the response
    pub status: QuoteStatus,

    // Quote line items
    pub details: Vec<QuoteDetail>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuoteClient {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub document: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuoteStatus {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuoteProduct {
    pub id: i32,
    pub description: String,
    pub code: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuoteDetail {
    pub id: i32,
    pub quote_id: i32,
    pub product_id: i32,
    pub product: QuoteProduct,
    pub unit_cost: f64,
    pub tax: f64,
    pub quantity: i32,
}
