use serde::{Serialize, Deserialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

/// DTO used to update the status and lifecycle dates of a purchase quote.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPurchaseQuoteDto {
    pub quote_id: i32,
    pub status_id: i32,
    pub date_sent: Option<NaiveDate>,
    pub date_received: Option<NaiveDate>,
    pub details: Option<Vec<PatchPurchaseQuoteLineDto>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPurchaseQuoteLineDto {
    pub product_id: i32,
    pub confirmed_quantity: i32,
    pub unit_cost: Decimal,
    pub enabled: bool,
}
