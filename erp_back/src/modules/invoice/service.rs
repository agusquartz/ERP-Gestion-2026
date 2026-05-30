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

use std::collections::HashMap;
use rust_decimal::{ 
    Decimal,
    prelude::FromPrimitive
};
use crate::shared::db_config;
use crate::modules::{
    product::{
        self,
        dto::ProductResponse,
    },
    invoice::{
        repository,
        errors,
        model::{
            NewInvoice, 
            LineProduct,
            LineItem
        },
        dto::{
            InvoiceListQuery,
            response::{
                InvoiceResponse,
                ListInvoicesView,
            },
            create::{
                CreateInvoiceDto, 
                CreateInvoiceLineItemDto
            },
        },
    },
};



/// Retrieves a list of invoices with optional filtering.
///
/// # Arguments
/// - `contains`: optional search term for filtering
///
/// # Returns
/// - Vector of `InvoiceResponse`
pub async fn list_invoices(query: InvoiceListQuery) -> Result<ListInvoicesView, errors::ServiceError> {
    let rows= repository::query_invoices(
        query.search, 
        query.filter, 
        query.since, 
        query.to, 
        query.status, 
        query.cursor, 
        query.limit + 1,
    ).await?;

    let mut invoices: Vec<InvoiceResponse> = rows.into_iter().map(InvoiceResponse::from).collect();

    let limit = query.limit as usize;
    //check if there's more invoices than what the limit allows us to return
    let has_more = invoices.len() > limit; 
    //drop the extra entity from the vector
    invoices.truncate(limit);
    //create the list view
    let view = ListInvoicesView {
        invoices: invoices,
        has_more: has_more,
    };

    Ok(view)
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
    // Validations
    if dto.details.is_empty() {
        return Err(errors::ServiceError::Validation(errors::ValidationError {
            context: "invoice must have at least one detail".to_string(),
        }));
    }

    for line in &dto.details {
        if line.quantity <= 0 {
            return Err(errors::ServiceError::Validation(errors::ValidationError {
                context: format!(
                             "quantity must be greater than zero for product {}",
                             line.product_id
                         ),
            }));
        }

        if line.unit_cost <= Decimal::from(0) {
            return Err(errors::ServiceError::Validation(errors::ValidationError {
                context: format!(
                             "unit cost must be greater than zero for product {}",
                             line.product_id
                         ),
            }));
        }
    }


    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await.map_err(db_config::DbError::from)?;

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
    for detail in &invoice.details {
        product::service::decrease_stock(
            &tx,
            detail.product.id,
            detail.quantity,
        )
            .await
            .map_err(|err| match err {
                db_config::DbError::Other(msg) if msg == "insufficient stock" => {
                    errors::ServiceError::Conflict(errors::ConflictError {
                        context: format!(
                                     "insufficient stock for product {}",
                                     detail.product.id
                                 ),
                    })
                }

                other => errors::ServiceError::Database(other),
            })?;
    }

    let invoice_id = repository::store_new_invoice(&tx, invoice).await?;

    tx.commit().await.map_err(db_config::DbError::from)?;

    let aggregate = repository::query_invoice_by_id(invoice_id)
        .await?
        .ok_or(errors::ServiceError::Database(
                db_config::DbError::InvariantViolation(
                    "Inserted invoice not found after commit".into(),
                ),
        ))?;

    let response = InvoiceResponse::from(aggregate);

    Ok(response)

}

/// Computes the total invoice amount.
///
/// IMPORTANT:
/// `unit_cost` already includes VAT/IVA.
/// Therefore, tax is stored as line metadata but is NOT added again.
///
/// Formula:
/// total = Σ(unit_cost × quantity)
fn compute_invoice_total(details: &[LineItem]) -> Decimal {
    let mut acc = Decimal::from(0);

    for line in details {
        let subtotal = line.unit_cost * Decimal::from(line.quantity);
        acc += subtotal;
    }

    acc
}
