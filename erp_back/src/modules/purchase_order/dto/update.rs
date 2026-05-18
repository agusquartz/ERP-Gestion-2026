use serde::{Serialize,Deserialize};

/// Data Transfer Object used to partially update a purchase order.
///
/// This struct represents a patch-style request where:
/// - Line item updates are mandatory
/// - Header updates (e.g., status) are optional
///
/// Responsibilities:
/// - Carries only the fields that are allowed to change
/// - Delegates validation and business rules to the service layer
///
/// Design notes:
/// - `details` is required and must contain at least one item
/// - `status_id` is optional and only applied if present
/// - `order_id` may be redundant if the identifier is already provided via route/path
///
/// Expected validation (service layer):
/// - Purchase order must exist
/// - Each referenced `product_id` must belong to the purchase order
/// - `received_quantity` must be >= 0 and should not exceed `ordered_quantity`
/// - Status transitions must follow allowed business rules
#[derive(Debug,Clone,Serialize,Deserialize,Default)]
#[serde(rename_all = "camelCase")]
pub struct PatchPurchaseOrderDto {
    /// Identifier of the purchase order being updated.
    ///
    /// Note: May be redundant if the ID is already supplied via request path.
    pub order_id: i32,

    /// Optional new status for the purchase order.
    ///
    /// If `None`, the status remains unchanged.
    pub status_id: Option<i32>,

    /// Line items to update.
    ///
    /// Each entry corresponds to an existing product in the purchase order.
    /// If `None`, it should be because we're cancelling the order
    pub details: Option<Vec<PatchPurchaseOrderLineDto>>,
}

/// Data Transfer Object representing an update to a single line item.
///
/// Responsibilities:
/// - Identifies the product within the purchase order
/// - Specifies the new received quantity
///
/// Design notes:
/// - Only `received_quantity` is mutable at this stage of the workflow
/// - Assumes the line already exists (no insert/delete semantics)
///
/// Expected validation (service layer):
/// - `product_id` must exist within the target purchase order
/// - `received_quantity` must be >= 0
/// - `received_quantity` should not exceed the originally ordered quantity
#[derive(Debug,Clone,Serialize,Deserialize,Default)]
#[serde(rename_all = "camelCase")]
pub struct PatchPurchaseOrderLineDto {
    /// Identifier of the product within the purchase order.
    pub product_id: i32,
    /// Updated quantity received for this product.
    pub received_quantity: i32,
}

