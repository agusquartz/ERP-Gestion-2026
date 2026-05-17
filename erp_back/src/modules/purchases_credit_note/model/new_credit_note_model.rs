use chrono::NaiveDate;
use rust_decimal::Decimal;

#[derive(Debug, Clone)]
pub struct NewCreditNote {
    pub note_number: String,
    pub return_note_id: i32,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub details: Vec<NewCreditNoteDetail>,
}

#[derive(Debug, Clone)]
pub struct NewCreditNoteDetail {
    pub product_id: i32,
    pub quantity: i32,
    pub unit_cost: Decimal,
    pub subtotal: Decimal,
}