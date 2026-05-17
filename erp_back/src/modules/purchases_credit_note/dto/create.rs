use serde::Deserialize;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

#[derive(Debug, Deserialize)]
pub struct CreateCreditNoteDto {
    pub note_number: String,
    pub return_note_id: i32,
    pub created_at: DateTime<Utc>,
    pub total: Decimal,
    pub details: Vec<CreateCreditNoteDetailDto>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCreditNoteDetailDto {
    pub product_id: i32,
    pub quantity: i32,
    pub unit_cost: Decimal,
    pub subtotal: Decimal,
}