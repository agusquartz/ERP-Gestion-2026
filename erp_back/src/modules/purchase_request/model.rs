use chrono::NaiveDate;
use rust_decimal::Decimal;
 
/// Aggregate model representing a purchase request and all associated quotes.
///
/// Used as the primary domain aggregate for purchase request retrieval operations.
pub struct PurchaseRequestAggregate {

    pub request: PurchaseRequest,

    pub quotes: Vec<Quote>,
}
 
/// Domain model representing a purchase request.
pub struct PurchaseRequest {
    pub id: i32,
    pub created_at: NaiveDate,
    pub employee: EmployeeSummary,
    pub details: Vec<RequestItem>,
}

/// Domain model representing a requested product line. 
pub struct RequestItem {
    pub product: LineProduct,
    pub quantity: i32,
}
 
/// Summary information about an employee.
pub struct EmployeeSummary {
    pub id: i32,
    pub name: String,
    pub surname: String,
}


/// Summary information about a product used in request or quote lines.
pub struct LineProduct {
    pub id: i32,
    pub code: String,
    pub description: String,
    pub category: Category,
}

/// Domain model representing a product category.
pub struct Category {
    pub id: i32,
    pub name: String,
}

/// Domain model representing an entity status.
pub struct Status {
    pub id: i32,
    pub name: String,
}

/// Domain model representing a supplier quote associated with a purchase request.
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

/// Summary information about a supplier.
pub struct SupplierSummary {
    pub id: i32,
    pub name: String,
    pub stamp: String,
}
 
/// Domain model representing a quoted product line.
pub struct QuoteDetail {
    pub product: LineProduct,
    pub confirmed_quantity: i32,
    pub unit_cost: Decimal,
    pub enabled: bool,
}
 
/// Domain model used to create a new purchase quote.
pub struct NewQuote{
    pub purchase_request_id: i32,
    pub supplier_id: i32,
    pub status_id: i32,
    pub created_at: NaiveDate,
    pub details: Vec<NewQuoteDetail>,
}

/// Domain model representing a new quote detail line.
pub struct NewQuoteDetail {
    pub product_id: i32,
    pub confirmed_quantity: i32,
    pub unit_cost: Decimal,
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
