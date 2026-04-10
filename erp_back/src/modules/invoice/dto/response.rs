use serde::{Serialize,Deserialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::modules::invoice::model;
use crate::modules::invoice::mapper;

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientResponse {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub ruc: String,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleConditionResponse {
    pub id: i32,
    pub name: String,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineItemResponse {
    pub product: LineProductResponse,
    pub unit_cost: Decimal,
    pub tax: i8,
    pub quantity: i32,
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
pub struct InvoiceResponse {
    pub id: i32,
    pub invoice_number: String,
    pub created_at: NaiveDate,
    pub date: NaiveDate,
    pub expiration_date: NaiveDate,
    pub total: Decimal,
    pub total_paid: Decimal,
    pub client: ClientResponse,
    pub sale_condition: SaleConditionResponse,
    pub quote_id: Option<i32>,
    pub details: Vec<LineItemResponse>,
}

impl From<model::InvoiceAggregate> for InvoiceResponse {
    fn from(value: model::InvoiceAggregate) -> Self {
        mapper::map_invoice(value)
    }
}
