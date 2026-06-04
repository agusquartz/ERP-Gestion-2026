use serde::{Serialize,Deserialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::modules::credit_notes::model;
use crate::modules::credit_notes::mapper;

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListCreditNotesView {
    pub credit_notes: Vec<CreditNoteResponse>,
    pub has_more: bool,
}

/// Line item representation returned to clients.
///
/// Includes computed financial values.
///
/// # Notes
/// - `subtotal` is derived (not stored in DB)
/// - Includes tax impact
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

/// Minimal invoice reference returned to clients.
///
/// Used instead of embedding full invoice data.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceReferenceResponse {
    pub id: i32,
    pub invoice_number: String,
}

/// Lightweight client representation returned by the API.
///
/// Contains only the information required for display.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientReferenceResponse {
    pub id: i32,
    pub name: String,
    pub surname: String,
}

/// API response representing a credit note.
///
/// # Structure
/// - Core metadata
/// - Associated invoice reference
/// - Fully expanded line items
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreditNoteResponse {
    pub id: i32,
    pub credit_note_number: String,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub invoice: InvoiceReferenceResponse,
    pub client: ClientReferenceResponse,
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

/// Converts a domain line item into a response DTO.
///
/// Delegates transformation logic to mapper.
impl From<model::CreditNoteLineItem> for CreditNoteLineItemResponse {
    fn from(value: model::CreditNoteLineItem) -> Self {
        mapper::map_credit_note_line(value)
    }
}
