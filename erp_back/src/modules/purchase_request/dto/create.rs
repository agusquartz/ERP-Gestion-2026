use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseRequestDto {
    pub created_at: NaiveDate,
    pub employee_id: i32,
    pub details: Vec<CreatePurchaseRequestDetailDto>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseRequestDetailDto {
    pub product_id: i32,
    pub quantity: i32,
}