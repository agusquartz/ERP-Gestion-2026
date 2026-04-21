//! # Quote Mapper Layer
//!
//! This module is responsible for **transforming data between representations**.
//! It sits between the repository (which works with domain models) and the
//! service/handler layers (which work with DTOs).
//!
//! ## Responsibilities
//! - Convert [`QuoteWithDetails`] domain aggregates → [`QuoteResponseDto`] API responses
//! - Collapse raw DB rows into domain aggregates (list-only variant)
//! - Keep all transformation logic in one place so services stay clean
//!
//! ## What this module does NOT do
//! - Execute SQL queries (that is the repository's job)
//! - Apply business rules or validation (that is the service's job)
//! - Interact with HTTP request/response types (that is the handler's job)
//!
//! ## Two mapping functions
//! | Function | Input | Output | Used by |
//! |---|---|---|---|
//! | [`rows_to_simple_quotes`] | `Vec<Row>` | `Vec<QuoteWithDetails>` | Potentially list queries without details |
//! | [`quote_with_details_to_response`] | `QuoteWithDetails` | `QuoteResponseDto` | Service layer for all endpoints |


use crate::modules::quote::model::*;
use crate::modules::quote::dto::response::*;
use tokio_postgres::Row;
use rust_decimal::Decimal;


/// Collapses a flat list of raw database rows into a list of [`QuoteWithDetails`] aggregates,
/// **without** populating the `details` field.
///
/// This function is intended for **list queries** where only the quote header and
/// its client/status snapshots are needed — not the full line-item breakdown.
/// Loading details for every quote in a list would be expensive and is usually
/// unnecessary for summary views.
///
/// ## Why aggregation is needed
/// Even without details, the base query uses JOINs on `clients` and `statuses`,
/// which can in theory produce multiple rows per quote if future schema changes
/// add one-to-many relationships at the header level. Using a `BTreeMap` here
/// future-proofs the function and keeps it consistent with `rows_to_aggregate`
/// in the repository.
///
/// ## BTreeMap vs HashMap
/// `BTreeMap` is used (instead of `HashMap`) to preserve insertion order by
/// `quote_id`, producing a deterministic output order without an explicit sort.
///
/// # Parameters
/// - `rows`: Raw rows returned by a `tokio_postgres` query. Each row must contain
///   the column aliases defined in `BASE_QUERY` in the repository.
///
/// # Returns
/// A `Vec<QuoteWithDetails>` where each entry has `details: vec![]`.
/// One entry per unique `quote_id` found in the rows.

pub fn rows_to_simple_quotes(rows: Vec<Row>) -> Vec<QuoteWithDetails> {
    use std::collections::BTreeMap;

    let mut map: BTreeMap<i32, QuoteWithDetails> = BTreeMap::new();

    for row in rows {
        let id: i32 = row.get("quote_id");

        // `or_insert_with` only builds the QuoteWithDetails on the first
        // occurrence of this quote_id — subsequent rows are ignored (no details).

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
            details: vec![],    // Details are intentionally omitted in list views
        });
    }

    map.into_values().collect()
}


/// Converts a fully hydrated [`QuoteWithDetails`] domain aggregate into a
/// [`QuoteResponseDto`] ready for JSON serialization.
///
/// This is the **primary mapping function** used by the service layer for all
/// three endpoints (`POST /quotes`, `GET /quotes/{id}`, `GET /quotes`).
///
/// ## Field mappings
/// | Model field | DTO field | Notes |
/// |---|---|---|
/// | `quote.id` | `id` | Direct copy |
/// | `quote.created_at` | `created_at` | `.to_string()` → `"YYYY-MM-DD"` |
/// | `quote.total` | `total` | Direct copy (Decimal) |
/// | `status.id / status.status` | `status.id / status.name` | Renamed: `status` → `name` |
/// | `client.*` | `client.*` | All fields copied directly |
/// | `details[].product.*` | `details[].product.*` | Nested copy |
/// | `details[].subtotal` | `details[].subtotal` | Pre-computed in repository |
///
/// ## Ownership
/// This function consumes the [`QuoteWithDetails`] by value (no cloning needed),
/// which is efficient since the model is always discarded after mapping.
///
/// # Parameters
/// - `model`: The fully populated domain aggregate from the repository.
///
/// # Returns
/// A [`QuoteResponseDto`] with all fields populated and ready for serialization.

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

        // Each QuoteDetail is mapped to a QuoteDetailResponseDto.
        // Note: `detail.id` and `detail.quote_id` are intentionally dropped here
        // as they are internal identifiers not relevant to API consumers.

        details: model.details.into_iter().map(|d| QuoteDetailResponseDto {
            product: QuoteProductResponseDto {
                id: d.product.id,
                description: d.product.description,
                code: d.product.code,
            },
            unit_cost: d.unit_cost,
            tax: d.tax,
            quantity: d.quantity,
            // subtotal was computed in the repository (not stored in DB);
            // it is carried through the model and exposed here directly.
            subtotal: d.subtotal,
        }).collect(),
    }
}
