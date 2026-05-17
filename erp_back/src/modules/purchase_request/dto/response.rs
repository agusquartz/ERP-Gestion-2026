
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Serialize, Deserialize};
use crate::modules::purchase_request::{
    model,
    mapper,
};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestResponse {
    pub id: i32,
    pub created_at: NaiveDate,
    pub employee: EmployeeSummaryResponse,

    pub details: Vec<PurchaseRequestItemsResponse>,

    pub quotes: Vec<PurchaseQuoteResponse>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmployeeSummaryResponse {
    pub id: i32,
    pub name: String,
    pub surname: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestItemsResponse {
    pub product: LineProductResponse,
    pub quantity: i32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineProductResponse {
    pub id: i32,
    pub description: String,
    pub code: String,
    pub category: CategoryResponse,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryResponse {
    pub id: i32,
    pub name: String,
}

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

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierSummaryResponse {
    pub id: i32,
    pub name: String,
    pub stamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusResponse {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseQuoteDetailResponse {
    pub product_id: i32,
    pub confirmed_quantity: i32,
    pub unit_cost: Decimal,
}

/// Conversion from domain aggregate to response DTO.
///
/// This implementation delegates transformation logic to the mapper layer,
/// ensuring separation of concerns between domain representation and API output.
///
/// Design notes:
/// - Consumes the aggregate (`value`) to avoid unnecessary cloning
/// - Centralizes mapping logic in `mapper::map_purchase_order`
impl From<model::PurchaseRequestAggregate> for PurchaseRequestResponse {
    fn from(value: model::PurchaseRequestAggregate) -> Self {
        mapper::map_purchase_request(value)
    }
}
