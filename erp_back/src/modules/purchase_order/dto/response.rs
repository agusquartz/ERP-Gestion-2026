use serde::{Serialize,Deserialize};
use chrono::NaiveDate;
use crate::modules::purchase_order::model::order_model;
use crate::modules::purchase_order::mapper;

/// Response DTO representing a supplier in the context of a purchase order.
///
/// This is a projection of the supplier entity tailored for API responses.
/// It includes only the fields required by clients.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierResponse {
    /// Unique identifier of the supplier.
    pub id: i32,
    /// Human-readable name of the supplier.
    pub name: String,

    pub stamp: String,
}

/// Response DTO representing the status of a purchase order.
///
/// This struct is a lightweight projection used in API responses.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusResponse {
    /// Unique identifier of the status.
    pub id: i32,
    /// Human-readable name of the status.
    pub name: String,
}

/// Response DTO representing a single line item in a purchase order.
///
/// This struct exposes both the ordered and received quantities,
/// along with product information resolved from the domain model.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderLineResponse {
    /// Product associated with this line item.
    pub product: LineProductResponse,
    /// Quantity originally ordered.
    pub ordered_quantity: i32,
    /// Quantity received so far.
    pub received_quantity: i32,
}

/// Response DTO representing product information within a line item.
///
/// This is a flattened projection intended for client consumption.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineProductResponse {
    /// Unique identifier of the product.
    pub id: i32,
    /// Human-readable description of the product.
    pub description: String,
    /// Internal or external product code.
    pub code: String,
}

/// Response DTO representing a purchase order.
///
/// This struct is the main API representation returned to clients.
/// It aggregates header information, supplier data, status, and line items.
///
/// Design notes:
/// - Built from a domain-level `PurchaseOrderAggregate`
/// - Uses nested DTOs to expose structured data
/// - Serialized using `camelCase` for API consistency
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderResponse {
    /// Unique identifier of the purchase order.
    pub id: i32,
    /// Unique identifier of the purchase request.
    pub purchase_request_id: i32,
    /// Date when the purchase order was created.
    pub created_at: NaiveDate,
    /// Supplier associated with the purchase order.
    pub supplier: SupplierResponse,
    /// Current status of the purchase order.
    pub status: StatusResponse,
    /// Line items included in the purchase order.
    pub details: Vec<PurchaseOrderLineResponse>,
}

/// Conversion from domain aggregate to response DTO.
///
/// This implementation delegates transformation logic to the mapper layer,
/// ensuring separation of concerns between domain representation and API output.
///
/// Design notes:
/// - Consumes the aggregate (`value`) to avoid unnecessary cloning
/// - Centralizes mapping logic in `mapper::map_purchase_order`
impl From<order_model::PurchaseOrderAggregate> for PurchaseOrderResponse {
    fn from(value: order_model::PurchaseOrderAggregate) -> Self {
        mapper::map_purchase_order(value)
    }
}
