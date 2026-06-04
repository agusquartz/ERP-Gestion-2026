//! # Quote Response DTO
//!
//! Defines the **JSON shape returned by all quote endpoints**.
//!
//! ## Why a dedicated response type?
//! The internal [`crate::modules::quote::model::QuoteWithDetails`] aggregate is
//! tightly coupled to the database schema and JOIN structure. Exposing it directly
//! would:
//! - Leak internal field names and DB column aliases
//! - Make it hard to rename or restructure fields without breaking the API contract
//! - Mix persistence concerns with serialization concerns
//!
//! Response DTOs act as an **anti-corruption layer**: the API shape can evolve
//! independently of the storage layer.
//!
//! ## Conversion
//! These structs are never constructed manually in handlers or services.
//! They are always produced by [`crate::modules::quote::mapper::quote_with_details_to_response`],
//! which takes a [`crate::modules::quote::model::QuoteWithDetails`] and maps each field.
//!
//! ## Naming convention
//! `#[serde(rename_all = "camelCase")]` on [`QuoteResponseDto`] ensures top-level
//! fields are serialized as `createdAt`, `unitCost`, etc. Nested structs that do
//! not carry this attribute serialize their fields as-is (already short enough
//! that snake_case and camelCase coincide, e.g. `id`, `name`, `code`).
 
use serde::{Serialize, Deserialize};
use rust_decimal::Decimal;

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListQuotesView {
    pub quotes: Vec<QuoteResponseDto>,
    pub has_more: bool,
}

/// The top-level JSON object returned for a quote in every endpoint response.
///
/// Returned as a single object by `GET /quotes/{id}` and `POST /quotes`,
/// and as an element in the array returned by `GET /quotes`.
///
/// # Example JSON
/// ```json
/// {
///   "id": 1,
///   "createdAt": "2025-04-10",
///   "status": { "id": 1, "name": "Draft" },
///   "total": "495.00",
///   "client": { "id": 5, "name": "John", "surname": "Doe", "document": "1234567" },
///   "details": [
///     {
///       "product": { "id": 12, "description": "Widget A", "code": "WGT-A" },
///       "unitCost": "150.00",
///       "tax": "10",
///       "quantity": 3,
///       "subtotal": "495.00"
///     }
///   ]
/// }
/// ```

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteResponseDto {
    /// Database-generated primary key of the quote.
    pub id: i32,
 
    /// Issue date of the quote serialized as an ISO 8601 string (`"YYYY-MM-DD"`).
    /// Stored as [`chrono::NaiveDate`] in the model; converted to `String`
    /// via `.to_string()` in the mapper.
    pub created_at: String,
 
    /// Current workflow status of the quote.
    pub status: QuoteStatusResponseDto,
 
    /// Grand total of all line items. Serialized as a decimal string by
    /// `rust_decimal` to preserve precision (avoids IEEE 754 rounding).
    pub total: Decimal,
 
    /// Snapshot of the client this quote was issued for.
    pub client: QuoteClientResponseDto,
 
    /// All line items belonging to this quote.
    /// Empty array `[]` on list endpoints that do not load details.
    pub details: Vec<QuoteDetailResponseDto>,
}


/// Nested status object within [`QuoteResponseDto`].
///
/// Provides both the numeric `id` (useful for front-end logic / filtering)
/// and the human-readable `name` (useful for display).

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteStatusResponseDto {
    /// Primary key of the status.
    pub id: i32,
    /// Human-readable status label (e.g. `"Draft"`, `"Approved"`).
    pub name: String,
}


/// Nested client object within [`QuoteResponseDto`].
///
/// A minimal projection of the client — only the fields relevant to
/// identifying the client on a quote are included.

#[derive(Debug, Clone,Serialize, Deserialize)]
pub struct QuoteClientResponseDto {
    /// Primary key of the client.
    pub id: i32,
    pub name: String,
    pub surname: String,
    /// National ID / document number used as a business identifier.
    pub document: String, 
}


/// Nested product object within [`QuoteDetailResponseDto`].
///
/// Describes the product referenced by a line item, using only the
/// fields needed for display on a quote document.
    
#[derive(Debug, Clone,Serialize, Deserialize)]
pub struct QuoteProductResponseDto {
    /// Primary key of the product.
    pub id: i32,
    /// Full product description.
    pub description: String,
    /// Short product code / SKU.
    pub code: String,
}


/// A single line item within the quote response.
///
/// The `subtotal` is a server-computed value (not stored in the DB) that
/// front-ends can display directly without recalculating.
///
/// Note: `id` is intentionally omitted from the response because consumers
/// identify line items by their product, not by the internal detail row id.

#[derive(Debug, Clone,Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteDetailResponseDto {
    /// The product associated with this line item.
    pub product: QuoteProductResponseDto,
 
    /// Price per unit at the time the quote was created.
    pub unit_cost: Decimal,
 
    /// Tax percentage applied to this line (e.g. `10` = 10%).
    pub tax: Decimal,
 
    /// Number of units included.
    pub quantity: i32,
 
    /// Precomputed subtotal: `unit_cost * quantity * (1 + tax / 100)`.
    /// Calculated server-side in the repository; not persisted in the DB.
    pub subtotal: Decimal,
}
