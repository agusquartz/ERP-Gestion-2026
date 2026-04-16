//! Quote domain models
//!
//! These structs represent the INTERNAL domain of the system.
//! They are NOT exposed to the API.

use chrono::NaiveDate;
use rust_decimal::Decimal;

/// Main quote entity stored in DB
#[derive(Debug, Clone)]
pub struct Quote {
    pub id: i32,

    /// Date without timezone (recommended for business documents)
    pub created_at: NaiveDate,

    pub total: Decimal,
    pub client_id: i32,
    pub status_id: i32,
}

/// Client snapshot inside quote aggregate
#[derive(Debug, Clone)]
pub struct QuoteClient {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub document: String,
}

/// Status snapshot
#[derive(Debug, Clone)]
pub struct QuoteStatus {
    pub id: i32,
    pub status: String,
}

/// Product inside quote detail
#[derive(Debug, Clone)]
pub struct QuoteProduct {
    pub id: i32,
    pub description: String,
    pub code: String,
}

/// Line item of a quote
#[derive(Debug, Clone)]
pub struct QuoteDetail {
    pub id: i32,
    pub quote_id: i32,
    pub product: QuoteProduct,
    pub unit_cost: Decimal,
    pub tax: Decimal,
    pub quantity: i32,
    pub subtotal: Decimal,
}

/// Fully hydrated aggregate returned from repository
#[derive(Debug, Clone)]
pub struct QuoteWithDetails {
    pub quote: Quote,
    pub client: QuoteClient,
    pub status: QuoteStatus,
    pub details: Vec<QuoteDetail>,
}
