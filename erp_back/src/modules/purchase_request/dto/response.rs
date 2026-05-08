

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestResponseDto {
    pub id: i32,
    pub created_at: String,
    pub employee: PurchaseRequestEmployeeResponseDto,
    pub details: Vec<PurchaseRequestDetailResponseDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseRequestEmployeeResponseDto {
    pub id: i32,
    pub name: String,
    pub surname: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseRequestProductResponseDto {
    pub id: i32,
    pub description: String,
    pub code: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestDetailResponseDto {
    pub id: i32,
    pub product: PurchaseRequestProductResponseDto,
    pub quantity: i32,
}