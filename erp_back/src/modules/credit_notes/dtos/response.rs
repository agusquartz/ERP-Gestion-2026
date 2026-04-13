use serde::{Serialize,Deserialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::modules::credit_notes::model;
use crate::modules::credit_notes::mapper;


/// Line item representation returned to clients.
///
/// Contains fully computed values including tax and pricing.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreditNoteLineItemResponse {
    pub product: LineProductResponse,
    pub unit_cost: Decimal,
    pub tax: Decimal,
    pub quantity: i32,
    pub subtotal: Decimal,
}

/// Lightweight product representation within a line item.
///
/// This avoids exposing the full product domain model.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineProductResponse {
    pub id: i32,
    pub description: String,
    pub code: String,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceReferenceResponse {
    pub id: i32,
    pub invoice_number: String,
}


#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreditNoteResponse {
    pub id: i32,
    pub credit_note_number: String,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub invoice: InvoiceReferenceResponse,
    pub details: Vec<CreditNoteLineItemResponse>,
}

/// Conversion from domain aggregate to API response.
///
/// Delegates transformation logic to the mapper module to keep DTOs clean.
impl From<model::CreditNoteAggregate> for CreditNoteResponse {
    fn from(value: model::CreditNoteAggregate) -> Self {
        mapper::map_credit_note(value)
    }
}

impl From<model::CreditNoteLineItem> for CreditNoteLineItemResponse {
    fn from(value: model::CreditNoteLineItem) -> Self {
        mapper::map_credit_note_line(value)
    }
}
