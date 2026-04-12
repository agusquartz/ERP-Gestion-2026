use crate::modules::credit_notes::model;
use crate::modules::credit_notes::dtos::response;

pub fn map_credit_note(value: model::CreditNoteAggregate) -> response::CreditNoteResponse {
    response::CreditNoteResponse {
        id: value.invoice.id,
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
            .map(|line| response::CreditNoteLineItemResponse { 
                subtotal: line.subtotal,
                unit_cost: line.unit_cost,
                tax: line.tax,
                quantity: line.quantity,
                product: response::LineProductResponse {
                    id: line.product.id,
                    description: line.product.description,
                    code: line.product.code,
                },
            })
        .collect(),
    }
}

