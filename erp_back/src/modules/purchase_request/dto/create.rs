//! dto/create.rs — purchase_request module
//!
//! Request body structs for POST endpoints.
//! These define the exact JSON shape the frontend must send
//! when creating new records.
//!
//! Endpoints covered:
//!   POST /purchase-quotes            → CreatePurchaseQuoteRequest
//!   POST /purchase-quotes/:id/details → SaveQuoteDetailsRequest

use rust_decimal::Decimal;
use serde::{Serialize, Deserialize};
use chrono::NaiveDate;

// =============================================================================
// POST /purchase-quotes
// =============================================================================

/// Request body for creating a new supplier quote.
///
/// Received when the user confirms a supplier selection in the
/// SupplierSearchModal and the frontend calls POST /purchase-quotes.
///
/// The backend automatically sets:
///   - status_id  → STATUS_CREATED (id=2)
///   - created_at → today's date
///
/// Fields:
///   purchase_request_id — The purchase request this quote belongs to.
///                         Must exist in the DB or the request will be rejected.
///   supplier_id         — The supplier being added to the request.
///                         Must exist in the DB or the insert will fail (FK).

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseRequestDto {
    pub created_at: NaiveDate,
    pub employee_id: i32,
    pub details: Vec<CreatePurchaseRequestDetailDto>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseRequestDetailDto {
    pub product_id: i32,

    /// How many units the supplier confirmed (must be > 0 for "reading" status)
    pub confirmed_quantity: i32,

    /// Unit price offered by the supplier (must be > 0 for "reading" status)
    pub unit_cost: Decimal,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePurchaseRequestDto {
    pub created_at: NaiveDate,
    pub employee_id: i32,
    pub details: Vec<CreatePurchaseRequestDtoLine>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePurchaseRequestDtoLine {
    pub product_id: i32,
    pub quantity: i32,
}
