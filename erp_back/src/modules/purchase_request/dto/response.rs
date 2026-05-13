
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Serialize, Deserialize};
use crate::modules::purchase_request::{
    model,
    mapper,
};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestResponseDto {
    pub id: i32,
    pub created_at: String,
    pub employee: PurchaseRequestEmployeeResponseDto,
    pub details: Vec<PurchaseRequestDetailResponseDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseRequestEmployeeResponseDto {
    pub id: i32,
    pub name: String,
    pub surname: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseRequestProductResponseDto {
    pub id: i32,
    pub description: String,
    pub code: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseRequestDetailResponseDto {
    pub id: i32,
    pub product: PurchaseRequestProductResponseDto,
    pub quantity: i32,
}

/// One supplier quote associated with a purchase request.
///
/// Maps to a single row in purchase_quotes.
/// Included in the purchase request response so the frontend
/// can render the SuppliersTable with current statuses and
/// open the QuotationModal with the correct data.
#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseQuoteResponse {
    /// Row ID in purchase_quotes
    pub id: i32,

    /// FK to suppliers(id)
    pub supplier_id: i32,

    /// Supplier name- joined from suppliers table
    pub supplier_name: String,

    /// Current status ID - used by frontend for transition logic
    /// Matchs the status table
    pub status_id: i32,

    /// Current status name - joined from statuses table
    pub status: String,

    /// Categories this supplier handles - joined from category_suppliers
    /// Used by the frontend to filter which products to show in QuotationModal
    pub categories: Vec<String>,

    /// Date the quote record was created
    pub created_at: NaiveDate,

    /// Date the quote ws sent to the suppliers
    /// Set automatically when status transitions to pending
    pub date_sent: Option<NaiveDate>,

    /// Date the supplier's response was received
    /// Set automatically when status transitions to ok
    pub date_received: Option<NaiveDate>,

    /// Confirmed product lines for this quote (from purchase_quotes_details)
    /// Empty until the user fills and saves the QuotationModal
    pub details: Vec<PurchaseQuoteDetailResponse>,
}

/// One confirmed product line within a supplier quote.
///
/// Maps to a single row in purchase_quotes_details.
/// Rendered as a pre-filled row in the QuotationModal when status
/// is "pending" or "reading".
#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseQuoteDetailResponse {
    /// Row ID in purchase_quotes_details
    pub id: i32,

    /// FK to products(id)
    pub product_id: i32,

    /// How many units the supplier confirmed they can provide
    pub confirmed_quantity: i32,

    /// Price per unit offered by the supplier
    pub unit_cost: Decimal,
}

// =============================================================================
// POST /purchase-quotes
// =============================================================================

/// Response body after creating a new supplier quote.
///
/// Returned immediately after the insert so the frontend can
/// render the new supplier row in SuppliersTable without
/// needing to re-fetch the entire purchase request.
#[derive(Debug, Serialize)]
pub struct CreatePurchaseQuoteResponse {
    /// Newly created quote ID
    pub id: i32,

    /// FK to purchase_requests(id)
    pub purchase_request_id: i32,

    /// FK to suppliers(id)
    pub supplier_id: i32,

    /// Supplier name — for immediate display in SuppliersTable
    pub supplier_name: String,

    /// Initial status name — always "created" on creation
    pub status: String,

    /// Initial status ID — always 2 (created) on creation
    pub status_id: i32,

    /// Date the quote was created — set to today by the backend
    pub created_at: NaiveDate,

    /// Supplier categories — for QuotationModal product filtering
    pub categories: Vec<String>,
}

// =============================================================================
// PATCH /purchase-quotes/:id
// =============================================================================

/// Response body after updating a supplier quote's status.
///
/// Returns only the fields that changed so the frontend can
/// update its local state without re-fetching the full request.
#[derive(Debug, Serialize)]
pub struct UpdatePurchaseQuoteResponse {
    /// ID of the updated quote
    pub id: i32,

    /// New status ID after the transition
    pub status_id: i32,

    /// New status name after the transition
    pub status: String,

    /// Set when transitioning to pending (3), null otherwise
    pub date_sent: Option<NaiveDate>,

    /// Set when transitioning to ok (4), null otherwise
    pub date_received: Option<NaiveDate>,
}

// =============================================================================
// POST /purchase-quotes/:id/details
// =============================================================================

/// Response body after saving quote details.
///
/// Simple confirmation — the frontend already has the data it sent,
/// so we only need to confirm the operation succeeded.
#[derive(Debug, Serialize)]
pub struct SaveQuoteDetailsResponse {
    /// ID of the quote whose details were saved
    pub purchase_quote_id: i32,

    /// Total number of detail rows saved
    /// Useful for the frontend to verify all rows were persisted
    pub saved_count: usize,
}

/// Conversion from domain aggregate to response DTO.
///
/// This implementation delegates transformation logic to the mapper layer,
/// ensuring separation of concerns between domain representation and API output.
///
/// Design notes:
/// - Consumes the aggregate (`value`) to avoid unnecessary cloning
/// - Centralizes mapping logic in `mapper::map_purchase_order`
impl From<model::PurchaseRequestAggregate> for PurchaseRequestResponse {
    fn from(value: model::PurchaseRequestAggregate) -> Self {
        mapper::map_purchase_request(value)
    }
}
