//! Invoice creation DTOs
//!
//! This module defines the structures used to receive and deserialize
//! incoming HTTP requests for invoice creation.
//!
//! These DTOs represent raw client input and are validated and transformed
//! in the service layer before being converted into domain models.
//!
//! # Design Principles
//! - Represents external input (not internal domain state)
//! - Uses camelCase for JSON compatibility
//! - Minimal logic: no validation or computation here
//! - Transformed into `NewInvoice` in service layer
use serde::{Deserialize, Serialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

/// Root DTO for invoice creation requests.
///
/// Represents the payload sent by the client when creating a new invoice.
///
/// # Responsibilities
/// - Captures client intent
/// - Deserialized directly from HTTP JSON body
/// - Passed to service layer for validation and transformation
///
/// # Notes
/// - Does not include computed fields (e.g., total)
/// - Does not include database-generated fields (e.g., id, created_at)
#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceDto {
    pub client_id: i32,
    pub invoice_number: String,
    pub date: NaiveDate,
    pub expiration_date: NaiveDate,
    pub sale_condition_id: i32,
    pub quote_id: Option<i32>,
    pub details: Vec<CreateInvoiceLineItemDto>,
}

/// DTO representing a single line item in invoice creation.
///
/// # Responsibilities
/// - Captures minimal product reference and pricing input
/// - Does not include product metadata (resolved later in service layer)
/// - Used to build `LineItem` after enrichment
#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceLineItemDto {
    pub product_id: i32,
    pub quantity: i32,
    pub unit_cost: Decimal,
}
