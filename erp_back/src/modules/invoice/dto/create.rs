use serde::{Deserialize, Serialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceDto {
    pub client_id: i32,
    pub invoice_number: String,
    pub date: NaiveDate,
    pub expiration_date: NaiveDate,
    pub sale_condition_id: i32,
    pub quote_id: Option<i32>,
    pub details: Vec<CreateInvoiceLineItemDto>,
}

#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceLineItemDto {
    pub product_id: i32,
    pub quantity: i32,
    pub unit_cost: Decimal,
}
