//! Invoice service layer
//!
//! This module contains the business logic for invoice operations.
//! It orchestrates interactions between:
//! - DTOs (input/output)
//! - repository layer (persistence)
//! - external modules (e.g., product service)
//!
//! # Responsibilities
//! - Validate incoming data
//! - Enrich data (e.g., fetch product info)
//! - Compute derived values (totals, taxes)
//! - Coordinate persistence via repository
//! - Map domain aggregates into API responses
//!
//! # Design Principles
//! - No direct SQL or database logic
//! - No HTTP concerns
//! - Central place for business rules

use crate::modules::product;
use crate::modules::product::dto::ProductResponse;
use crate::modules::invoice::repository;
use crate::modules::invoice::model::{NewInvoice, LineProduct, LineItem};
use crate::modules::invoice::dto::response::InvoiceResponse;
use crate::modules::invoice::dto::create::{CreateInvoiceDto, CreateInvoiceLineItemDto};
use crate::modules::invoice::errors;

use std::collections::HashMap;
use rust_decimal::{ Decimal,
                    prelude::FromPrimitive};


/// Retrieves a list of invoices with optional filtering.
///
/// # Arguments
/// - `contains`: optional search term for filtering
///
/// # Returns
/// - Vector of `InvoiceResponse`
pub async fn list_invoices(contains: Option<String>) -> Result<Vec<InvoiceResponse>, errors::ServiceError> {
    let rows= repository::query_invoices(contains.as_deref()).await?;
    Ok(rows.into_iter().map(|inv| InvoiceResponse::from(inv)).collect())
}

/// Retrieves a single invoice by ID.
///
/// # Returns
/// - `Some(InvoiceResponse)` if found
/// - `None` if not found
pub async fn get_invoice(id: i32) -> Result<Option<InvoiceResponse>, errors::ServiceError> {
    let invoice = repository::query_invoice_by_id(id).await?;
    Ok(invoice.map(|inv| InvoiceResponse::from(inv)))
}

/// Creates a new invoice.
///
/// # Workflow
/// 1. Fetch products for each line item
/// 2. Validate product existence
/// 3. Build `LineItem`s with tax and pricing
/// 4. Compute total amount
/// 5. Construct `NewInvoice`
/// 6. Persist via repository
/// 7. Map result to `InvoiceResponse`
pub async fn create_invoice(dto: CreateInvoiceDto) -> Result<InvoiceResponse, errors::ServiceError> {
    //make a map with products
    let mut products: HashMap<i32,ProductResponse> = HashMap::new();

    for line in &dto.details {
        //Bring product from db
        let p: ProductResponse = product::service::get_product(line.product_id)
            .await?
            .ok_or(errors::ServiceError::Validation( errors::ValidationError{
                    context: format!("missing product {}", line.product_id)
            }))?;
        //insert to map
        products.insert(p.id, p);
    }

    let mut details: Vec<LineItem> = Vec::new();
    //create all LineItems
    for line in dto.details {

        let product = products
            .get(&line.product_id)
            .expect("already validated above");

        let tax = product
            .taxes
            .first()
            .ok_or(errors::ServiceError::Validation( errors::ValidationError { 
                context: format!("product with id {} has no tax associated", product.id) }))?
            .percentage;

        let item = LineItem {
            product: LineProduct {
                id: product.id,
                code: product.code.clone(),
                description: product.description.clone(),
            },
            unit_cost: line.unit_cost,
            tax: Decimal::from_f64(tax).ok_or(errors::ServiceError::Validation( errors::ValidationError {
                context: "invalid float tax value".to_string()
            }))?,
            quantity: line.quantity
        };
        //store in details vector
        details.push(item);
    }

    //compute total amount 
    let total = compute_invoice_total(&details);

    //create invoice proper
    let invoice = NewInvoice {
        invoice_number: dto.invoice_number,
        date: dto.date,
        expiration_date: dto.expiration_date,
        total: total,
        quote_id: dto.quote_id,
        client_id: dto.client_id,
        sale_condition_id: dto.sale_condition_id,
        details: details
    };

    //now just send to repo and let that layer take charge
    let aggregate = repository::store_new_invoice(invoice).await?; 
    let response = InvoiceResponse::from(aggregate);
    Ok(response)

}

/// Computes the total invoice amount including taxes.
///
/// # Formula
/// total = Σ (unit_cost × quantity) + tax_amount
fn compute_invoice_total(details: &Vec<LineItem>) -> rust_decimal::Decimal {
    let mut acc: Decimal = Decimal::from(0);

    for line in details {
        let subtotal = line.unit_cost * Decimal::from(line.quantity);
        let tax_amount = subtotal * line.tax / Decimal::from(100);
        acc = acc + subtotal + tax_amount;
    }

    acc
}
