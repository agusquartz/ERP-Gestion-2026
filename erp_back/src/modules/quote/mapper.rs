//! Quote Mapper Layer
//!
//! Responsibilities:
//! - Convert domain models → DTOs
//! - Keep transformation logic isolated
//! - No DB logic, no business logic

use crate::modules::quote::model::*;
use crate::modules::quote::dto::response::*;
use tokio_postgres::Row;
use rust_decimal::Decimal;

pub fn rows_to_simple_quotes(rows: Vec<Row>) -> Vec<QuoteWithDetails> {
    use std::collections::BTreeMap;

    let mut map: BTreeMap<i32, QuoteWithDetails> = BTreeMap::new();

    for row in rows {
        let id: i32 = row.get("quote_id");

        map.entry(id).or_insert_with(|| QuoteWithDetails {
            quote: Quote {
                id,
                created_at: row.get("created_at"),
                total: row.get("total"),
                client_id: row.get("client_id"),
                status_id: row.get("status_id"),
            },
            client: QuoteClient {
                id: row.get("client_id"),
                name: row.get("client_name"),
                surname: row.get("client_surname"),
                document: row.get("client_document"),
            },
            status: QuoteStatus {
                id: row.get("status_id"),
                status: row.get("status_name"),
            },
            details: vec![], // no details in list endpoint
        });
    }

    map.into_values().collect()
}


/// Converts full aggregate into API response
pub fn quote_with_details_to_response(model: QuoteWithDetails) -> QuoteResponseDto {
    QuoteResponseDto {
        id: model.quote.id,
        created_at: model.quote.created_at.to_string(),
        status: QuoteStatusResponseDto {
            id: model.status.id,
            name: model.status.status,
        },
        total: model.quote.total,
        client: QuoteClientResponseDto {
            id: model.client.id,
            name: model.client.name,
            surname: model.client.surname,
            document: model.client.document,
        },
        details: model.details.into_iter().map(|d| QuoteDetailResponseDto {
            product: QuoteProductResponseDto {
                id: d.product.id,
                description: d.product.description,
                code: d.product.code,
            },
            unit_cost: d.unit_cost,
            tax: d.tax,
            quantity: d.quantity,
            subtotal: d.subtotal,
        }).collect(),
    }
}
