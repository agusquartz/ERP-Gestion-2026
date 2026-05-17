//! Purchase invoice domain models
//!
//! This module defines the core data structures for the purchase invoice bounded context.
//!
//! # Design
//! Follows the same pattern as `purchase_order::model`:
//! - A single aggregate struct (`PurchaseInvoice`) holds the full reconstructed state,
//!   including nested line items from JOINs
//! - A separate write model (`NewPurchaseInvoice`) holds only what is needed for INSERT
//! - Sub-structs (`Supplier`, `Category`, etc.) are lightweight projections that avoid
//!   coupling this module to the full domain models of other modules
//!
//! # Read vs Write models
//! - `PurchaseInvoice` → returned from repository queries, source for response DTOs
//! - `NewPurchaseInvoice` → built in the mapper, consumed by the repository on creation
use chrono::NaiveDate;
use rust_decimal::Decimal;


// ── Shared projections ───────────────────────────────────────────────────────
 
/// Denormalized supplier snapshot used inside read models.
///
/// Only contains what the invoice context needs — does not expose
/// the full supplier domain model.
#[derive(Debug, Clone)]
pub struct Supplier {
    pub id: i32,
    pub name: String,
    pub stamp: String,
}

/// Denormalized sale condition snapshot used inside read models.
#[derive(Debug, Clone)]
pub struct SaleCondition {
    pub id: i32,
    pub name: String,
}
 
/// Denormalized category snapshot used inside line item product projections.
#[derive(Debug, Clone)]
pub struct Category {
    pub id: i32,
    pub name: String,
}

/// Lightweight product projection used inside invoice line items.
///
/// Avoids coupling the invoice context to the full product domain model.
#[derive(Debug, Clone)]
pub struct LineProduct {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub category: Category,
}

// ── Read models ──────────────────────────────────────────────────────────────
 
/// A single line item inside a purchase invoice.
///
/// `subtotal` is computed in the repository row mapper as `unit_cost * quantity`.
/// It is never stored as a column — derived on every read.
#[derive(Debug, Clone)]
pub struct InvoiceLineItem {
    pub product: LineProduct,
    pub unit_cost: Decimal,
    pub quantity: i32,
    pub subtotal: Decimal,
}


/// Fully reconstructed purchase invoice aggregate.
///
/// Used for both list and detail endpoints, following the same pattern as
/// `PurchaseOrderAggregate` in the purchase_order module.
///
/// `details` is always populated by the repository — the list response DTO
/// simply ignores it, while the detail response DTO includes it.
///
/// # Notes
/// - `supplier` and `sale_condition` are denormalized projections from JOINs
/// - `payment_status` is derived in the response layer from `total` vs `total_paid`
#[derive(Debug, Clone)]
pub struct PurchaseInvoice {
    pub id: i32,
    pub invoice_nr: String,
    pub purchase_order_id: i32,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub total_paid: Decimal,
    pub supplier: Supplier,
    pub sale_condition: SaleCondition,
    pub details: Vec<InvoiceLineItem>,
}



// ── Write models ─────────────────────────────────────────────────────────────
 
/// Write model used when creating a new purchase invoice.
///
/// Uses raw foreign key IDs — the only place in this module where
/// `sale_condition_id` appears as a plain integer field, because the
/// repository needs it for the INSERT statement.
#[derive(Debug, Clone)]
pub struct NewPurchaseInvoice {
    pub invoice_nr: String,
    pub purchase_order_id: i32,
    pub sale_condition_id: i32,
    pub total: Decimal,
    pub items: Vec<NewInvoiceLineItem>,
}

/// Write model for a single invoice line item.
///
/// Only carries what the DB needs — no product metadata.
/// `product_code` and `product_name` from the frontend DTO are discarded in the mapper.
#[derive(Debug, Clone)]
pub struct NewInvoiceLineItem {
    pub product_id: i32,
    pub unit_cost: Decimal,
    pub quantity: i32,
}