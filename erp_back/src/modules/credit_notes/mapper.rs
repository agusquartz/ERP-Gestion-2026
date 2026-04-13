use crate::modules::credit_notes::model;
use crate::modules::credit_notes::dtos::response;

use rust_decimal::Decimal; //TODO: delete this. don't forget

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
            .map(|line| map_credit_note_line(line) )
        .collect(),
    }
}

pub fn map_credit_note_line(line: model::CreditNoteLineItem) -> response::CreditNoteLineItemResponse {
    response::CreditNoteLineItemResponse {
        unit_cost: line.unit_cost,
        quantity: line.quantity,
        tax: line.tax,
        subtotal: compute_line_subtotal(&line),
        //subtotal: service::compute_line_subtotal(&line),  TODO:This is how it should look like later
        product: response::LineProductResponse {
            id: line.product.id,
            code: line.product.code,
            description: line.product.description,
        }
    }
}

///TODO:This should probably go to service, but I'll implement it here because I need it here and now, 
///refactor later, as service.rs doesn't even exist yet
fn compute_line_subtotal(line: &model::CreditNoteLineItem) -> rust_decimal::Decimal {
    let duty_free = line.unit_cost * Decimal::from(line.quantity);
    let tax_amount = duty_free * line.tax / Decimal::from(100);
    let subtotal = duty_free + tax_amount;
    subtotal
}
