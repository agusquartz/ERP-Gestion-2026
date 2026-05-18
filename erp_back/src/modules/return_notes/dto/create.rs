use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReturnNoteDto {
    pub purchase_invoice_id: i32,
    pub motive: String,
    pub created_at: Option<NaiveDate>,
    pub details: Vec<CreateReturnNoteDetailDto>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReturnNoteDetailDto {
    pub product_id: i32,
    pub returned_quantity: i32,
    pub amount: Decimal,
}