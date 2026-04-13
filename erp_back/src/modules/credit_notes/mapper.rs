use crate::modules::credit_notes::service;
use crate::modules::credit_notes::model;
use crate::modules::credit_notes::dto::response;

/// Maps a `CreditNoteAggregate` into an API response.
///
/// # Responsibilities
/// - Transforms domain model into response DTO
/// - Flattens aggregate structure
/// - Delegates line-level mapping
///
/// # Notes
/// - Does NOT perform validation
/// - Relies on service layer for business correctness
pub fn map_credit_note(value: model::CreditNoteAggregate) -> response::CreditNoteResponse {
    response::CreditNoteResponse {
        id: value.credit_note.id,
        credit_note_number: value.credit_note.credit_note_number,
        invoice: response::InvoiceReferenceResponse {
            id: value.invoice.id,
            invoice_number: value.invoice.invoice_number,
        },
        created_at: value.credit_note.created_at,
        total: value.credit_note.total,
        details: value.credit_note
            .details
            .into_iter()
            .map(map_credit_note_line)
        .collect(),
    }
}

/// Maps a domain line item into a response line item.
///
/// # Responsibilities
/// - Copies structural data
/// - Computes derived values (subtotal)
///
/// # Notes
/// - Subtotal is calculated using service-layer logic
/// - Ensures consistency with total calculation
pub fn map_credit_note_line(line: model::CreditNoteLineItem) -> response::CreditNoteLineItemResponse {
    response::CreditNoteLineItemResponse {
        unit_cost: line.unit_cost,
        quantity: line.quantity,
        tax: line.tax,
        subtotal: service::compute_line_subtotal(&line),  
        product: response::LineProductResponse {
            id: line.product.id,
            code: line.product.code,
            description: line.product.description,
        }
    }
}

