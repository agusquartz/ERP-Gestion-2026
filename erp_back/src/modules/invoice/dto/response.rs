//! Invoice response DTOs
//!
//! This module defines the structures returned to clients via the HTTP API.
//! These are serialization-focused representations of invoice data, derived
//! from domain models (`InvoiceAggregate`) through mapping functions.
//!
//! # Design Principles
//! - Decoupled from internal domain models
//! - Stable contract for API consumers
//! - Uses camelCase naming for JSON compatibility
//! - Constructed exclusively via mapping layer

use serde::{Serialize,Deserialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::modules::invoice::model;
use crate::modules::invoice::mapper;

/// Client representation exposed through the API.
///
/// This is a projection of the internal `Client` model adapted for external use.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientResponse {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub ruc: String,
}

/// Sale condition representation exposed through the API.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleConditionResponse {
    pub id: i32,
    pub name: String,
}

/// Line item representation returned to clients.
///
/// Contains fully computed values including tax and pricing.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineItemResponse {
    pub product: LineProductResponse,
    pub unit_cost: Decimal,
    pub tax: Decimal,
    pub quantity: i32,
}

/// Lightweight product representation within a line item.
///
/// This avoids exposing the full product domain model.
#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineProductResponse {
    pub id: i32,
    pub description: String,
    pub code: String,
}

/// Full invoice response returned by the API.
///
/// This struct represents the final serialized form of an invoice,
/// including related entities and computed line items.
///
/// # Construction
/// Built from `InvoiceAggregate` via the mapper layer.
///
/// # Responsibilities
/// - API output representation
/// - Serialization into JSON
/// - Encapsulation of all data required by frontend/client
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

/// Conversion from domain aggregate to API response.
///
/// Delegates transformation logic to the mapper module to keep DTOs clean.
impl From<model::InvoiceAggregate> for InvoiceResponse {
    fn from(value: model::InvoiceAggregate) -> Self {
        mapper::map_invoice(value)
    }
}
