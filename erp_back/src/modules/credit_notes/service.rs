use crate::modules::product;
use crate::modules::product::dto::ProductResponse;
use crate::modules::credit_notes::repository;
use crate::modules::credit_notes::model::{NewCreditNote, LineProduct, CreditNoteLineItem};
use crate::modules::credit_notes::dto::{ response::CreditNoteResponse,
                                         create::CreateCreditNoteDto };
use crate::shared::db_config;

use std::collections::HashMap;
use rust_decimal::{ Decimal,
                    prelude::FromPrimitive};

/// Errors that can occur in the service layer.
///
/// # Variants
/// - `Db`: database-related failures
/// - `Product`: errors from product service
/// - `Validation`: business rule violations
#[derive(Debug)]
pub enum ServiceError {
    Db(db_config::DbError),
    Product(product::service::ServiceError),
    Validation(String),
}
/// Converts product service errors into service errors.
impl From<product::service::ServiceError> for ServiceError {
    fn from(err: product::service::ServiceError) -> Self {
        Self::Product(err)
    }
}

/// Converts a database error into a service error.
impl From<db_config::DbError> for ServiceError {
    fn from(value: db_config::DbError) -> Self {
        Self::Db(value)
    }
}

/// Formats the error for user-facing messages or logs.
impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::Db(_) => write!(f, "database error"),
            ServiceError::Validation(msg) => write!(f, "validation error: {msg}"),
            ServiceError::Product(product::service::ServiceError::Db(value)) => write!(f, "error getting product from the database: {value}"),
            ServiceError::Product(product::service::ServiceError::Validation(msg)) => write!(f, "error in product validation: {msg}"),
        }
    }
}

impl std::error::Error for ServiceError {}

/// Lists credit notes with optional filtering.
pub async fn list_credit_notes(contains: Option<String>) -> Result<Vec<CreditNoteResponse>, ServiceError> {
    let rows= repository::query_credit_notes(contains.as_deref()).await?;
    Ok(rows.into_iter().map(|note| CreditNoteResponse::from(note)).collect())
}

/// Retrieves a single credit note by ID.
///
/// # Returns
/// - `Some(CreditNoteResponse)` if found
/// - `None` otherwise
pub async fn get_credit_note(id: i32) -> Result<Option<CreditNoteResponse>, ServiceError> {
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
pub async fn create_credit_note(dto: CreateCreditNoteDto) -> Result<CreditNoteResponse, ServiceError> {
    //make a map with products
    let mut products: HashMap<i32,ProductResponse> = HashMap::new();

    for line in &dto.details {
        //Bring product from db
        let p: ProductResponse = product::service::get_product(line.product_id)
            .await?
            .ok_or(ServiceError::Validation(
                    format!("missing product {}", line.product_id)))?;
        //insert to map
        products.insert(p.id, p);
    }

    let mut details: Vec<CreditNoteLineItem> = Vec::new();
    //create all LineItems
    for line in dto.details {

        let p= products
            .get(&line.product_id)
            .expect("already validated above");

        let tax = p.taxes.first().expect("Should always have one").percentage;

        let item = CreditNoteLineItem {
            product: LineProduct {
                id: p.id,
                code: p.code.clone(),
                description: p.description.clone(),
            },
            unit_cost: line.unit_cost,
            tax: Decimal::from_f64(tax).ok_or(ServiceError::Validation("invalid float".to_string()))?,
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
