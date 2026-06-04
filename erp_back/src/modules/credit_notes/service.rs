use crate::modules::credit_notes::repository;
use crate::modules::credit_notes::errors;
use crate::modules::credit_notes::model::{ NewCreditNote, 
                                           LineProduct, 
                                           CreditNoteLineItem };
use crate::modules::credit_notes::dto::{ 
    CreditNoteListQuery,
    response::{
        CreditNoteResponse,
        ListCreditNotesView,
    },
    create::CreateCreditNoteDto };

use crate::modules::product::{ self,
                               dto::ProductResponse };
use std::collections::HashMap;
use rust_decimal::{ Decimal,
                    prelude::FromPrimitive};

/// Lists credit notes with optional filtering.
pub async fn list_credit_notes(query: CreditNoteListQuery) -> Result<ListCreditNotesView, errors::ServiceError> {

    let rows= repository::query_credit_notes(
        query.search, 
        query.filter, 
        query.since, 
        query.to, 
        query.status, 
        query.cursor, 
        query.limit + 1,
    ).await?;

    let mut credit_notes: Vec<CreditNoteResponse> = rows.into_iter().map(CreditNoteResponse::from).collect();

    let limit = query.limit as usize;
    //check if there's more quotes than what the limit allows us to return
    let has_more = credit_notes.len() > limit; 
    //drop the extra order from the vector
    credit_notes.truncate(limit);
    //create the list view
    let view = ListCreditNotesView {
        credit_notes: credit_notes,
        has_more: has_more,
    };

    Ok(view)
}

/// Retrieves a single credit note by ID.
///
/// # Returns
/// - `Some(CreditNoteResponse)` if found
/// - `None` otherwise
pub async fn get_credit_note(id: i32) -> Result<Option<CreditNoteResponse>, errors::ServiceError> {
    let invoice = repository::query_credit_note_by_id(id).await?;
    Ok(invoice.map(|note| CreditNoteResponse::from(note)))
}

/// Creates a new credit note.
///
/// # Workflow
/// 1. Resolve products from product service
/// 2. Build domain line items
/// 3. Compute total
/// 4. Persist via repository
/// 5. Map aggregate to response
pub async fn create_credit_note(dto: CreateCreditNoteDto) -> Result<CreditNoteResponse, errors::ServiceError> {
    //make a map with products
    let mut products: HashMap<i32,ProductResponse> = HashMap::new();

    for line in &dto.details {
        //Bring product from db
        let p: ProductResponse = product::service::get_product(line.product_id)
            .await?
            .ok_or(errors::ServiceError::Validation( errors::ValidationError {
                    context: format!("missing product {}", line.product_id)}))?;
        //insert to map
        products.insert(p.id, p);
    }

    let mut details: Vec<CreditNoteLineItem> = Vec::new();
    //create all LineItems
    for line in dto.details {

        let p= products
            .get(&line.product_id)
            .expect("already validated above");

        let tax = p.taxes.first().ok_or( errors::ServiceError::Validation( errors::ValidationError {
            context: format!("product with id {} has no tax associatd", p.id)}))?
            .percentage;

        let item = CreditNoteLineItem {
            product: LineProduct {
                id: p.id,
                code: p.code.clone(),
                description: p.description.clone(),
            },
            unit_cost: line.unit_cost,
            tax: Decimal::from_f64(tax).ok_or(errors::ServiceError::Validation( errors::ValidationError {
                context: "invalid float tax value".to_string(),
                    }))?,
            quantity: line.quantity
        };
        //store in details vector
        details.push(item);
    }

    //create credit note proper
    let credit_note = NewCreditNote {
        credit_note_number: dto.credit_note_number,
        sale_invoice_id: dto.sale_invoice_id,
        created_at: dto.created_at,
        total: compute_credit_note_total(&details),
        details: details
    };

    //now just send to repo and let that layer take charge
    let aggregate = repository::store_new_credit_note(credit_note).await?; 
    let response = CreditNoteResponse::from(aggregate);
    Ok(response)

}

/// Computes the total invoice amount including taxes.
///
/// # Formula
/// total = Σ (unit_cost × quantity) + tax_amount
fn compute_credit_note_total(details: &Vec<CreditNoteLineItem>) -> rust_decimal::Decimal {
    let total = details.iter().fold(Decimal::ZERO, |acc, line| {
        let subtotal = compute_line_subtotal(line);
        acc + subtotal 
    });

    total
}

pub fn compute_line_subtotal(line: &CreditNoteLineItem) -> rust_decimal::Decimal {
    let duty_free = line.unit_cost * Decimal::from(line.quantity);
    let tax_amount = duty_free * line.tax / Decimal::from(100);
    let subtotal = duty_free + tax_amount;
    subtotal
}
