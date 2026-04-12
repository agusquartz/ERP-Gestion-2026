//! Invoice domain models
//!
//! This module defines the core data structures used in the invoice bounded context.
//! It includes persistence entities, write models, computed line structures, and
//! aggregate read models used for database reconstruction and service-to-API mapping.
use chrono::NaiveDate;
use rust_decimal::Decimal;

/// Represents a persisted invoice entity.
///
/// This struct corresponds closely to the `invoices` table and represents the
/// canonical stored state of an invoice.
///
/// # Responsibilities
/// - Database persistence representation
/// - Aggregate root for invoice-related queries
/// - Source of truth for invoice lifecycle state
///
/// # Notes
/// - `details` are denormalized line items attached to the invoice aggregate
/// - `total` is stored as a snapshot value (not recomputed dynamically)
/// - `total_paid` represents accumulated payments and may not be fully used yet
#[derive(Debug,Clone)]
pub struct Invoice {
    pub id: i32,
    pub invoice_number: String,
    pub created_at: NaiveDate,
    pub date: NaiveDate,
    pub expiration_date: NaiveDate,
    pub total: Decimal,
    pub total_paid: Decimal,
    pub quote_id: Option<i32>,
    pub client_id: i32,
    pub sale_condition_id: i32,
    pub details: Vec<LineItem>,
}

/// Write model used when creating a new invoice.
///
/// This struct represents input from the service layer into the repository.
/// It excludes database-generated fields such as `id` and `created_at`.
///
/// # Responsibilities
/// - Encapsulates invoice creation intent
/// - Transferred from service to repository
/// - Contains precomputed totals and validated line items
#[derive(Debug,Clone)]
pub struct NewInvoice {
    pub invoice_number: String,
    pub date: NaiveDate,
    pub expiration_date: NaiveDate,
    pub total: Decimal,
    pub quote_id: Option<i32>,
    pub client_id: i32,
    pub sale_condition_id: i32,
    pub details: Vec<LineItem>,
}

/// Represents a client snapshot inside invoice aggregates.
///
/// This is a denormalized projection used for read models.
#[derive(Debug,Clone)]
pub struct Client {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub document: String, 
}

/// Represents payment conditions applied to an invoice.
///
/// Used as part of the invoice aggregate for read operations.
#[derive(Debug,Clone)]
pub struct SaleCondition {
    pub id: i32,
    pub name: String,
}

/// Represents a computed invoice line item.
///
/// Line items are constructed in the service layer from product data,
/// pricing, quantity, and tax rules.
///
/// # Responsibilities
/// - Represents final invoice line state
/// - Stores computed tax and pricing values
/// - Used for persistence in `invoice_lines` table
#[derive(Debug,Clone)]
pub struct LineItem {
    pub product: LineProduct,
    pub unit_cost: Decimal,
    pub tax: Decimal,
    pub quantity: i32,
}

/// Lightweight product projection used inside invoice context.
///
/// Avoids coupling invoice domain directly to full product domain model.
#[derive(Debug,Clone)]
pub struct LineProduct {
    pub id: i32,
    pub description: String,
    pub code: String,
}

/// Aggregate root returned from repository layer.
///
/// This represents a fully reconstructed invoice view including related entities
/// required by the service and API layers.
#[derive(Debug,Clone)]
pub struct InvoiceAggregate {
    pub invoice: Invoice,
    pub client: Client,
    pub sale_condition: SaleCondition,
}
