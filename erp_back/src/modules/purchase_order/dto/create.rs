use serde::{Deserialize, Serialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseOrderDto {
    pub purchase_request_id: i32,
    pub created_at: NaiveDate,
    pub supplier_id: i32,
    pub details: Vec<CreatePurchaseOrderLineDto>,
}

/// DTO representing a single line item in invoice creation.
///
/// # Responsibilities
/// - Captures minimal product reference and pricing input
/// - Does not include product metadata (resolved later in service layer)
/// - Used to build `LineItem` after enrichment
#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseOrderLineDto {
    pub product_id: i32,
    pub ordered_quantity: i32,
}
