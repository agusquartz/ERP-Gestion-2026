use serde::{Serialize,Deserialize};
use chrono::NaiveDate;

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierResponse {
    pub id: i32,
    pub name: String,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusResponse {
    pub id: i32,
    pub name: String,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderLineResponse {
    pub product: LineProductResponse,
    pub ordered_quantity: i32,
    pub received_quantity: i32,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineProductResponse {
    pub id: i32,
    pub description: String,
    pub code: String,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderResponse {
    pub id: i32,
    pub created_at: NaiveDate,
    pub supplier: SupplierResponse,
    pub status: StatusResponse,
    pub details: Vec<PurchaseOrderLineResponse>,
}

