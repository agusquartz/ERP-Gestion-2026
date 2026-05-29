use chrono::NaiveDate;

/// Represents a purchase order as a domain entity.
///
/// This struct models the core business object, including its header data
/// and associated line items. It is typically constructed from a database
/// join and used as part of an aggregate.
///
/// Invariants:
/// - `details` may be empty depending on query shape (e.g., LEFT JOIN),
///   but in most business scenarios a purchase order is expected to have at least one line.
/// - `received_quantity` for each detail should not exceed `ordered_quantity`
///   (this constraint is not enforced at this level).
#[derive(Debug,Clone)]
pub struct PurchaseOrder {
    /// Unique identifier of the purchase order.
    pub id: i32,
    /// Date when the purchase order was created.
    pub created_at: NaiveDate,
    /// Reference to the originating purchase request.
    pub purchase_request_id: i32,
    /// Identifier of the supplier fulfilling this order.
    pub supplier_id: i32,
    /// Current status of the purchase order (e.g., Draft, Approved, Received).
    pub status: Status,
    /// Collection of line items associated with this purchase order.
    pub details: Vec<LineItem>,
}

/// Represents a supplier entity.
///
/// This is a simplified projection typically joined into a purchase order aggregate.
/// It does not necessarily reflect the full supplier domain model.
#[derive(Debug,Clone)]
pub struct Supplier {
    /// Unique identifier of the supplier.
    pub id: i32,
    /// Human-readable name of the supplier.
    pub name: String,

    pub stamp: String,
}

/// Represents the status of a purchase order.
///
/// Status is modeled as a separate entity to allow normalization
/// and enforce controlled transitions at the service layer.
#[derive(Debug,Clone)]
pub struct Status {
     /// Unique identifier of the status.
    pub id: i32,
    /// Human-readable name of the status.
    pub name: String,
}

/// Represents a single line item within a purchase order.
///
/// Each line item corresponds to a product and tracks both the
/// quantity ordered and the quantity received.
///
/// Invariants:
/// - `received_quantity` should be >= 0
/// - `received_quantity` should not exceed `ordered_quantity`
/// These constraints are expected to be enforced at a higher layer.
#[derive(Debug,Clone)]
pub struct LineItem {
    /// Product associated with this line item.
    pub product: LineProduct,
    /// Quantity requested in the purchase order.
    pub ordered_quantity: i32,
    /// Quantity that has been received so far.
    pub received_quantity: i32,
}

/// Represents a product within a line item context.
///
/// This is a lightweight projection used for display and aggregation purposes.
/// It does not necessarily include full product domain data.
#[derive(Debug,Clone)]
pub struct LineProduct {
    /// Unique identifier of the product.
    pub id: i32,
    /// Human-readable description of the product.
    pub description: String,
    /// Internal or external product code.
    pub code: String,
}

/// Aggregate root combining a purchase order with its related supplier.
///
/// This struct is typically the result of a database query that joins
/// purchase order data with supplier data. It represents the full
/// domain view required by application services or API responses.
///
/// Design note:
/// - The supplier is duplicated outside of `PurchaseOrder` to keep the
///   core entity focused and allow flexible aggregation depending on query needs.
#[derive(Debug,Clone)]
pub struct PurchaseOrderAggregate {
    /// The core purchase order entity.
    pub purchase_order: PurchaseOrder,
    /// The supplier associated with the purchase order.
    pub supplier: Supplier,
}
