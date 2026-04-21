use serde::{Deserialize, Serialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

/// DTO used to create a new credit note.
///
/// Received from client (HTTP request).
///
/// # Responsibilities
/// - Captures user input only
/// - No derived or computed values
/// - Enriched in service layer before persistence
#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCreditNoteDto {
    pub credit_note_number: String,
    pub created_at: NaiveDate,
    pub sale_invoice_id: i32,
    pub details: Vec<CreateCreditNoteLineDto>,
}

/// DTO representing a single line item during creation.
///
/// # Responsibilities
/// - Contains minimal product reference and pricing input
/// - Product details resolved later in service layer
#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCreditNoteLineDto {
    pub product_id: i32,
    pub quantity: i32,
    pub unit_cost: Decimal,
}
