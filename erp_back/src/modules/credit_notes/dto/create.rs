use serde::{Deserialize, Serialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCreditNoteDto {
    pub credit_note_number: String,
    pub created_at: NaiveDate,
    pub sale_invoice_id: i32,
    pub details: Vec<CreateCreditNoteLineDto>,
}

/// DTO representing a single line item in invoice creation.
///
/// # Responsibilities
/// - Captures minimal product reference and pricing input
/// - Does not include product metadata (resolved later in service layer)
/// - Used to build `LineItem` after enrichment
#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCreditNoteLineDto {
    pub product_id: i32,
    pub quantity: i32,
    pub unit_cost: Decimal,
}
