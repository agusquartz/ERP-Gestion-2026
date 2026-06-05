
use crate::modules::purchase_order::model::order_model;
use crate::modules::purchase_order::dto::response;

/// Maps a domain-level `PurchaseOrderAggregate` into an API-facing `PurchaseOrderResponse`.
///
/// Responsibilities:
/// - Transforms internal domain structures into response DTOs
/// - Flattens and reshapes nested domain data for client consumption
/// - Ensures separation between domain representation and API contract
///
/// Design notes:
/// - Consumes the input aggregate to avoid unnecessary cloning
/// - Performs a straightforward field-by-field mapping (no business logic)
/// - Assumes all required data is already present and valid in the aggregate
///
/// Mapping details:
/// - `PurchaseOrder` → core response fields (`id`, `created_at`, `status`, `details`)
/// - `Supplier` → nested `SupplierResponse`
/// - `LineItem` → `PurchaseOrderLineResponse`
/// - `LineProduct` → `LineProductResponse`
///
/// Invariants:
/// - `details` is mapped as-is; empty collections are allowed depending on query shape
/// - No validation is performed here; invalid data must be handled upstream
///
/// Performance considerations:
/// - Uses `into_iter()` to move data and avoid cloning
/// - Linear transformation over `details` (O(n))
pub fn map_purchase_order(value: order_model::PurchaseOrderAggregate) -> response::PurchaseOrderResponse {
    response::PurchaseOrderResponse {
        /// Purchase order identifier
        id: value.purchase_order.id,
        /// Originatin purchase request identifier
        purchase_request_id: value.purchase_order.purchase_request_id,
        /// Creation date of the purchase order
        created_at: value.purchase_order.created_at,
        /// Supplier projection
        supplier: response::SupplierResponse {
            id: value.supplier.id,
            name: value.supplier.name,
            stamp: value.supplier.stamp,
        },
        /// Status projection
        status: response::StatusResponse {
            id: value.purchase_order.status.id,
            name: value.purchase_order.status.name,
        },
        /// Line items mapped into response DTOs
        details: value.purchase_order
            .details
            .into_iter()
            .map(|line| response::PurchaseOrderLineResponse { 
                ordered_quantity: line.ordered_quantity,
                received_quantity: line.received_quantity,
                product: response::LineProductResponse {
                    id: line.product.id,
                    description: line.product.description,
                    code: line.product.code,
                },
            })
        .collect(),
    }
}

