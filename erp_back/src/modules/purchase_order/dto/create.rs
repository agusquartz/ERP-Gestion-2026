use serde::{Deserialize, Serialize};
use chrono::NaiveDate;

/// Data Transfer Object used to create a new purchase order.
///
/// This struct represents the external input (e.g., HTTP request body)
/// required to construct a `NewPurchaseOrder` in the domain layer.
///
/// Responsibilities:
/// - Captures only client-provided data
/// - Delegates validation and enrichment to the service layer
/// - Uses `camelCase` for API compatibility
///
/// Design notes:
/// - Does not include `id` or `status`, as these are system-defined
/// - `details` must contain at least one line item
///
/// Expected validation (service layer):
/// - `details` must not be empty
/// - `supplier_id` and `purchase_request_id` must exist
/// - Each `ordered_quantity` must be > 0
/// - Duplicate `product_id` entries should be handled (rejected or merged)
#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseOrderDto {
    /// Reference to the originating purchase request.
    pub purchase_request_id: i32,
    /// Date when the purchase order is created.
    pub created_at: NaiveDate,
    /// Identifier of the supplier fulfilling this order.
    pub supplier_id: i32,
    /// Line items to be included in the purchase order.
    pub details: Vec<CreatePurchaseOrderLineDto>,
}

/// Data Transfer Object representing a single line item in purchase order creation.
///
/// Responsibilities:
/// - Captures minimal product reference and requested quantity
/// - Defers product validation and enrichment to the service layer
///
/// Design notes:
/// - Does not include product metadata (e.g., description, code)
/// - `received_quantity` is implicitly initialized to 0 during persistence
///
/// Expected validation (service layer):
/// - `product_id` must reference an existing product
/// - `ordered_quantity` must be > 0
#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseOrderLineDto {
    /// Identifier of the product being ordered.
    pub product_id: i32,
    /// Quantity requested for this product.
    pub ordered_quantity: i32,
}
