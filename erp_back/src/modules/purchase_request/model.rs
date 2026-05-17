//! model.rs — purchase_request module
use chrono::NaiveDate;
use rust_decimal::Decimal;
 
pub struct PurchaseRequestAggregate {

    pub request: PurchaseRequest,

    pub quotes: Vec<Quote>,
}
 
// =============================================================================
// purchase_requests
// =============================================================================
 
pub struct PurchaseRequest {
    pub id: i32,
    pub created_at: NaiveDate,
    pub employee: EmployeeSummary,
    pub details: Vec<RequestItem>,
}
 
// =============================================================================
// purchase_request_details
// =============================================================================
 
/// One product line item in a purchase request.
pub struct RequestItem {
    pub product: LineProduct,
    pub quantity: i32,
}
 
pub struct EmployeeSummary {
    pub id: i32,
    pub name: String,
    pub surname: String,
}

pub struct LineProduct {
    pub id: i32,
    pub code: String,
    pub description: String,
    pub category: Category,
}

pub struct Category {
    pub id: i32,
    pub name: String,
}

pub struct Status {
    pub id: i32,
    pub name: String,
}
// =============================================================================
// purchase_quotes 
// =============================================================================
 
/// One supplier quote with its confirmed lines and supplier categories.
pub struct Quote {
    pub id: i32,
    pub purchase_request_id: i32,
    pub created_at: NaiveDate,
    pub date_sent: Option<NaiveDate>,
    pub date_received: Option<NaiveDate>,
    pub supplier: SupplierSummary,
    pub status: Status,
    pub details: Vec<QuoteDetail>,
}

pub struct SupplierSummary {
    pub id: i32,
    pub name: String,
    pub stamp: String,
}
 
// =============================================================================
// purchase_quotes_details
// =============================================================================
 
/// One confirmed product line within a supplier quote.
///
/// Maps to a single row in purchase_quotes_details.
pub struct QuoteDetail {
    pub product: LineProduct,
    pub confirmed_quantity: i32,
    pub unit_cost: Decimal,
}

pub struct NewQuoteDetail {
    pub product_id: i32,
    pub confirmed_quantity: i32,
    pub unit_cost: Decimal,
}
 
// =============================================================================
// POST /purchase-quotes 
// =============================================================================
 
pub struct NewQuote{
    pub purchase_request_id: i32,
    pub supplier_id: i32,
    pub status_id: i32,
    pub created_at: NaiveDate,
    pub details: Vec<NewQuoteDetail>,
}

 
// =============================================================================
// Aggregate for PATCH /purchase-quotes/:id response
// =============================================================================
 
/// Minimal aggregate returned after updating a quote's status.
///
/// Only contains the fields that changed — avoids re-fetching
/// the full purchase request after a status update.
pub struct PatchedQuoteAggregate {
    pub id: i32,
    pub status_id: i32,
    pub status_name: String,
    pub date_sent: Option<NaiveDate>,
    pub date_received: Option<NaiveDate>,
}


pub struct NewPurchaseRequest {
    pub created_at: NaiveDate,
    pub employee_id: i32,
    pub details: Vec<NewPurchaseRequestLine>,
}

pub struct NewPurchaseRequestLine {
    pub product_id: i32,
    pub quantity: i32,
}
