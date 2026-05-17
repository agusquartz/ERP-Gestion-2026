//! dto/create.rs — purchase_request module
//!
//! Request body structs for POST endpoints.
//! These define the exact JSON shape the frontend must send
//! when creating new records.
//!
//! Endpoints covered:
//!   POST /purchase-quotes            → CreatePurchaseQuoteRequest
//!   POST /purchase-quotes/:id/details → SaveQuoteDetailsRequest

use rust_decimal::Decimal;
use serde::{Serialize, Deserialize};
use chrono::NaiveDate;

// =============================================================================
// POST /purchase-quotes
// =============================================================================

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseQuoteDto {
    pub purchase_request_id: i32,
    pub supplier_id: i32,
    pub created_at: NaiveDate,
    pub details: Vec<QuoteDetailLine>
}


/// One product line to save within a supplier quote.
///
/// Fields:
///   product_id          — FK to products(id)
///   confirmed_quantity  — Units the supplier confirmed they can provide
///   unit_cost           — Price per unit offered by the supplier

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteDetailLine {
    pub product_id: i32,
    pub confirmed_quantity: i32,
    pub unit_cost: Decimal,
}


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseRequestDto {
    pub created_at: NaiveDate,
    pub employee_id: i32,
    pub details: Vec<CreatePurchaseRequestDtoLine>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseRequestDtoLine {
    pub product_id: i32,
    pub quantity: i32,
}
