use chrono::NaiveDate;
use serde::Serialize;

use crate::modules::quote::model::{
    QuoteClient,
    QuoteDetail,
    QuoteProduct,
    QuoteStatus,
    QuoteWithDetails,
};

// ------------------------------------------------------------
// QuoteResponseDto
// This DTO represents the public response returned by the API
// when a quote is created, listed, or fetched by ID.
//
// It is the structure the frontend will consume.
// ------------------------------------------------------------

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuoteResponseDto {
    pub id: i32,
    pub created_at: NaiveDate,
    pub status: QuoteStatusResponseDto,
    pub total: f64,
    pub client: QuoteClientResponseDto,
    pub details: Vec<QuoteDetailResponseDto>,
}

// ------------------------------------------------------------
// QuoteStatusResponseDto
// Small DTO used inside QuoteResponseDto to expose the status
// in a clean and readable way.
// ------------------------------------------------------------

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuoteStatusResponseDto {
    pub id: i32,
    pub name: String,
}

// ------------------------------------------------------------
// QuoteClientResponseDto
// Small DTO used inside QuoteResponseDto to expose the client
// summary without returning the full client entity.
// ------------------------------------------------------------

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuoteClientResponseDto {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub document: String,
}

// ------------------------------------------------------------
// QuoteDetailResponseDto
// This DTO represents each line inside a quote response.
// Each detail contains product data plus pricing information.
// ------------------------------------------------------------
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuoteDetailResponseDto {
    pub product: QuoteProductResponseDto,
    pub unit_cost: f64,
    pub tax: f64,
    pub quantity: i32,
    pub subtotal: f64,
}


// ------------------------------------------------------------
// QuoteProductResponseDto
// Product summary used inside each quote detail.
// This avoids returning the full product entity.
// ------------------------------------------------------------
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuoteProductResponseDto {
    pub id: i32,
    pub description: String,
    pub code: String,
}

// ------------------------------------------------------------
// From<QuoteWithDetails> for QuoteResponseDto
// This conversion transforms the internal quote model into the
// public API response DTO.
// ------------------------------------------------------------
impl From<QuoteWithDetails> for QuoteResponseDto {
    fn from(value: QuoteWithDetails) -> Self {
        QuoteResponseDto {
            id: value.quote.id,
            created_at: value.quote.created_at,
            status: value.status.into(),
            total: value.quote.total,
            client: value.client.into(),
            details: value.details.into_iter().map(Into::into).collect(),
        }
    }
}

// ------------------------------------------------------------
// From<QuoteStatus> for QuoteStatusResponseDto
// Converts the internal status model into the public response DTO.
// ------------------------------------------------------------
impl From<QuoteStatus> for QuoteStatusResponseDto {
    fn from(value: QuoteStatus) -> Self {
        QuoteStatusResponseDto {
            id: value.id,
            name: value.name,
        }
    }
}

// ------------------------------------------------------------
// From<QuoteClient> for QuoteClientResponseDto
// Converts the internal client summary into the public response DTO.
// ------------------------------------------------------------

impl From<QuoteClient> for QuoteClientResponseDto {
    fn from(value: QuoteClient) -> Self {
        QuoteClientResponseDto {
            id: value.id,
            name: value.name,
            surname: value.surname,
            document: value.document,
        }
    }
}

// ------------------------------------------------------------
// From<QuoteDetail> for QuoteDetailResponseDto
// Converts each internal quote detail into the public response DTO.
// ------------------------------------------------------------
impl From<QuoteDetail> for QuoteDetailResponseDto {
    fn from(value: QuoteDetail) -> Self {
        QuoteDetailResponseDto {
            product: value.product.into(),
            unit_cost: value.unit_cost,
            tax: value.tax,
            quantity: value.quantity,
            subtotal: value.subtotal,
        }
    }
}


// ------------------------------------------------------------
// From<QuoteProduct> for QuoteProductResponseDto
// Converts the internal product summary into the public response DTO.
// ------------------------------------------------------------
impl From<QuoteProduct> for QuoteProductResponseDto {
    fn from(value: QuoteProduct) -> Self {
        QuoteProductResponseDto {
            id: value.id,
            description: value.description,
            code: value.code,
        }
    }
}


