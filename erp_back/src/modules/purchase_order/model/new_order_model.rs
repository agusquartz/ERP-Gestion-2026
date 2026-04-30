use chrono::NaiveDate;

/// Represents the input required to create a new purchase order.
///
/// This struct is typically constructed from an API request and later
/// transformed into a persisted `PurchaseOrder`.
///
/// Design notes:
/// - Does not include `id` or `status`, as these are assigned by the system.
/// - Does not include `received_quantity`, since nothing has been received at creation time.
/// - `details` is expected to contain at least one line item.
///
/// Invariants (expected to be enforced at service layer):
/// - `details` must not be empty
/// - Each `ordered_quantity` must be > 0
/// - `supplier_id` and `purchase_request_id` must reference existing entities
#[derive(Debug,Clone)]
pub struct NewPurchaseOrder {
    /// Date when the purchase order is created.
    pub created_at: NaiveDate,
    /// Reference to the originating purchase request.
    pub purchase_request_id: i32,
    /// Identifier of the supplier fulfilling this order.
    pub supplier_id: i32,
    /// Collection of line items to be created for this purchase order.
    pub details: Vec<NewPurchaseOrderLine>,
}

/// Represents a line item in a purchase order creation request.
///
/// This is a minimal representation used only during creation.
/// It references a product and specifies the requested quantity.
///
/// Design notes:
/// - Does not embed full product data (`LineProduct`) to avoid unnecessary coupling.
/// - `received_quantity` is implicitly initialized to 0 at persistence time.
///
/// Invariants (expected to be enforced at service layer):
/// - `ordered_quantity` must be > 0
/// - `product_id` must reference an existing product
/// - Duplicate `product_id` entries should typically be rejected or normalized
#[derive(Debug,Clone)]
pub struct NewPurchaseOrderLine {
    /// Identifier of the product being ordered.
    pub product_id: i32,
    /// Quantity requested for this product.
    pub ordered_quantity: i32,
}

