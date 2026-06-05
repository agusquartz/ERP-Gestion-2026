
use chrono::NaiveDate;
use rust_decimal::Decimal;

/// Core domain entity representing a credit note.
///
/// A credit note reverses or adjusts a previously issued invoice.
/// It contains financial totals and associated line items.
///
/// # Invariants
/// - `sale_invoice_id` must reference an existing invoice
/// - `total` must equal the sum of all line items (including tax)
#[derive(Debug,Clone)]
pub struct CreditNote {
    pub id: i32,
    pub sale_invoice_id: i32,
    pub credit_note_number: String,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub details: Vec<CreditNoteLineItem>,
}

/// Lightweight client projection.
///
/// Used to expose client information without loading
/// the entire client domain model.
#[derive(Debug, Clone)]
pub struct ClientReference {
    pub id: i32,
    pub name: String,
    pub surname: String,
}

/// Lightweight reference to an invoice.
///
/// Used inside aggregates to avoid loading full invoice data.
#[derive(Debug,Clone)]
pub struct InvoiceReference {
    pub id: i32,
    pub invoice_number: String,
}

/// Line item within a credit note.
///
/// Represents a single product adjustment with pricing and tax.
///
/// # Notes
/// - Does NOT store computed subtotal (derived at service/mapper level)
#[derive(Debug,Clone)]
pub struct CreditNoteLineItem {
    pub product: LineProduct,
    pub unit_cost: Decimal,
    pub tax: Decimal,
    pub quantity: i32,
}

/// Minimal product projection used in line items.
///
/// Avoids coupling with full product domain model.
#[derive(Debug,Clone)]
pub struct LineProduct {
    pub id: i32,
    pub description: String,
    pub code: String,
}

/// Aggregate root returned from repository layer.
///
/// Represents a fully reconstructed credit note with all required
/// related data for service and API layers.
///
/// # Composition
/// - Credit note core data
/// - Associated invoice reference
#[derive(Debug,Clone)]
pub struct CreditNoteAggregate {
    pub credit_note: CreditNote,
    pub invoice: InvoiceReference,
    pub client: ClientReference,
}

/// Write model used when creating a new credit note.
///
/// Passed from service layer to repository for persistence.
///
/// # Responsibilities
/// - Contains only data required for insertion
/// - Assumes validation and enrichment already occurred in service
#[derive(Debug,Clone)]
pub struct NewCreditNote {
    pub credit_note_number: String,
    pub sale_invoice_id: i32,
    pub created_at: NaiveDate,
    pub details: Vec<CreditNoteLineItem>,
    pub total: Decimal,
}
