use rust_decimal::Decimal;
use serde::{Serialize, Deserialize};
use chrono::NaiveDate;

/// DTO used to create a supplier quote associated with a purchase request.
///
/// Represents the quote header and all quoted product lines.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseQuoteDto {
    pub purchase_request_id: i32,
    pub supplier_id: i32,
    pub created_at: NaiveDate,
    pub details: Vec<QuoteDetailLine>
}


/// DTO representing a single quoted product line.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteDetailLine {
    pub product_id: i32,
    pub confirmed_quantity: i32,
    pub unit_cost: Decimal,
}

/// DTO used to create a purchase request.
///
/// Contains the request header and all requested product lines.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseRequestDto {
    pub created_at: NaiveDate,
    pub employee_id: i32,
    pub details: Vec<CreatePurchaseRequestDtoLine>,
}

/// DTO representing a single product line inside a purchase request.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseRequestDtoLine {
    pub product_id: i32,
    pub quantity: i32,
}
