use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Serialize, Deserialize};
use crate::modules::purchase_request::{
    model,
    mapper,
};

/// Response DTO representing a purchase request with its details and quotes.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestResponse {
    pub id: i32,
    pub created_at: NaiveDate,
    pub employee: EmployeeSummaryResponse,

    pub details: Vec<PurchaseRequestItemsResponse>,

    pub quotes: Vec<PurchaseQuoteResponse>,
}

/// Summary information about an employee.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmployeeSummaryResponse {
    pub id: i32,
    pub name: String,
    pub surname: String,
}

/// Response DTO representing a requested product line.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestItemsResponse {
    pub product: LineProductResponse,
    pub quantity: i32,
}

/// Summary information about a product used in request or quote lines.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineProductResponse {
    pub id: i32,
    pub description: String,
    pub code: String,
    pub category: CategoryResponse,
}

/// Summary information about a product category.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryResponse {
    pub id: i32,
    pub name: String,
}

/// Response DTO representing a purchase quote linked to a purchase request.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseQuoteResponse {
    pub id: i32,
    pub supplier: SupplierSummaryResponse,
    pub status: StatusResponse,
    pub created_at: NaiveDate,
    pub date_sent: Option<NaiveDate>,
    pub date_received: Option<NaiveDate>,
    pub details: Vec<PurchaseQuoteDetailResponse>,
}

/// Summary information about a supplier.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierSummaryResponse {
    pub id: i32,
    pub name: String,
    pub stamp: String,
}

/// Summary information about an entity status.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusResponse {
    pub id: i32,
    pub name: String,
}

/// Response DTO representing a quoted product line.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseQuoteDetailResponse {
    pub product_id: i32,
    pub confirmed_quantity: i32,
    pub unit_cost: Decimal,
}

/// Converts a purchase request aggregate model into its API response representation.
impl From<model::PurchaseRequestAggregate> for PurchaseRequestResponse {
    fn from(value: model::PurchaseRequestAggregate) -> Self {
        mapper::map_purchase_request(value)
    }
}
