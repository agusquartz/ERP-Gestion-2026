use chrono::NaiveDate;
use rust_decimal::Decimal;

#[derive(Debug,Clone)]
pub struct CreditNote {
    pub id: i32,
    pub sale_invoice_id: i32,
    pub credit_note_number: String,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub details: Vec<CreditNoteLineItem>,
}

#[derive(Debug,Clone)]
pub struct InvoiceReference {
    pub id: i32,
    pub invoice_number: String,
}

#[derive(Debug,Clone)]
pub struct CreditNoteLineItem {
    pub product: LineProduct,
    pub unit_cost: Decimal,
    pub tax: Decimal,
    pub quantity: i32,
    pub subtotal: Decimal,
}

#[derive(Debug,Clone)]
pub struct LineProduct {
    pub id: i32,
    pub description: String,
    pub code: String,
}

/// Aggregate root returned from repository layer.
///
/// This represents a fully reconstructed invoice view including related entities
/// required by the service and API layers.
#[derive(Debug,Clone)]
pub struct CreditNoteAggregate {
    pub credit_note: CreditNote,
    pub invoice: InvoiceReference,
}

#[derive(Debug,Clone)]
pub struct NewCreditNote {
    pub credit_note_number: String,
    pub sale_invoice_id: i32,
    pub created_at: NaiveDate,
    pub details: Vec<CreditNoteLineItem>,
}
