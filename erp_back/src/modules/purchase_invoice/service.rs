//! Purchase invoice service
//!
//! Business logic layer — sits between the handler (HTTP) and the repository (SQL).
//!
//! # Design
//! Mirrors `purchase_order::service`:
//! - Functions named `list_*`, `get_*`, `create_*` to match the existing convention
//! - Simple delegation to repository + `From` mapping for reads
//! - Transaction orchestration for writes, with cross-module side effects
//!
//! # Cross-module dependencies on create
//! Creating an invoice triggers two side effects in other modules,
//! all within the same transaction so they are atomic:
//! - `purchase_order::service::increase_received_quantity`
//! - `product::service::increase_stock`
use crate::modules::purchase_invoice::{
    dto::{
        PurchaseInvoicesListQuery,
        create::CreatePurchaseInvoiceDto,
        response::{
            PaginatedInvoicesResponse,
            PurchaseInvoiceDetailResponse,
            PurchaseInvoiceResponse,
        },
    
    },
    errors::ServiceError,
    mapper,
    repository,
};

use crate::modules::purchase_order;
use crate::modules::product;
use crate::db_config;

/// Lists purchase invoices, optionally filtered by a search term.
///
/// Mirrors `list_purchase_orders` from `purchase_order::service`.
///
/// # Filtering
/// Delegates to `repository::query_invoices` — when `contains` is `None`,
/// all invoices are returned; otherwise filtered by supplier name, invoice
/// number, or purchase order id.
pub async fn list_purchase_invoices(
    query: PurchaseInvoicesListQuery,
) -> Result<PaginatedInvoicesResponse, ServiceError> {
 
    let fetch_limit = query.limit + 1;
 
    let mut invoices = repository::query_invoices(
        query.search.as_deref(),
        query.filter.as_deref(),
        query.from,
        query.to,
        query.status.as_deref(),
        query.cursor,
        fetch_limit,
    ).await?;
 
    let has_more = invoices.len() as i64 > query.limit;
    if has_more {
        invoices.pop();
    }
 
    let next_cursor = if has_more {
        invoices.last().map(|i| i.id)
    } else {
        None
    };
 
    let data = invoices.into_iter().map(PurchaseInvoiceResponse::from).collect();
 
    Ok(PaginatedInvoicesResponse { data, next_cursor, has_more })
}



/// Retrieves a single purchase invoice by ID, including its line items.
///
/// Mirrors `get_purchase_order` from `purchase_order::service`.
///
/// Returns:
/// - `Ok(Some(...))` if found
/// - `Ok(None)` if not found (handler maps this to 404)
pub async fn get_purchase_invoice(
    id: i32
) -> Result<Option<PurchaseInvoiceDetailResponse>, ServiceError> {
    let invoice = repository::query_purchase_invoice_by_id(id).await?;
    Ok(invoice.map(PurchaseInvoiceDetailResponse::from))
}



/// Creates a new purchase invoice and triggers its side effects atomically.
///
/// Mirrors `create_purchase_order` from `purchase_order::service`.
///
/// # Steps inside the transaction
/// 1. Insert the invoice header and all line items
/// 2. For each item: increment `received_quantity` on the purchase order detail
/// 3. For each item: increment `stock` on the product
///
/// If any step fails, the transaction is rolled back and nothing is persisted.
///
/// # Returns
/// The `id` of the newly created invoice.
pub async fn create_purchase_invoice(
    dto: CreatePurchaseInvoiceDto,
) -> Result<i32, ServiceError> {
    // Map before opening the transaction — fail fast without holding a DB connection
    let new_invoice = mapper::to_new_invoice(dto);
 
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;
 
    let result: Result<i32, ServiceError> = async {
 
        // Step 1 — insert invoice header and line items
        let invoice_id = repository::create(&tx, &new_invoice).await?;
 
        // Steps 2 & 3 — cross-module side effects per line item
        for item in &new_invoice.items {
            purchase_order::service::increase_received_quantity(
                &tx,
                new_invoice.purchase_order_id,
                item.product_id,
                item.quantity,
            ).await?;
 
            product::service::increase_stock(
                &tx,
                item.product_id,
                item.quantity,
            ).await?;
        }
 
        Ok(invoice_id)
 
    }.await;
 
    match result {
        Ok(id) => {
            tx.commit().await?;
            Ok(id)
        }
        Err(e) => {
            let _ = tx.rollback().await;
            Err(e)
        }
    }
}
