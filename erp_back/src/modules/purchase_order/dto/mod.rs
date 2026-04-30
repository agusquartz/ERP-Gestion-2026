use serde::{ Deserialize, Serialize };

pub mod create;
pub mod update;
pub mod response;

/// Query DTO for listing purchase orders.
///
/// This struct represents the query parameters accepted by the
/// "list purchase orders" endpoint.
///
/// Responsibilities:
/// - Encapsulates filtering input from the client
/// - Serves as a boundary between HTTP layer and service layer
///
/// Fields:
/// - `contains`: optional free-text filter applied to:
///     - supplier name
///     - status name
///     - creation date (string-matched)
///
/// Notes:
/// - The interpretation of this filter is delegated to the repository layer
/// - If `None` or empty, no filtering is applied
/// - Designed to be deserialized from query parameters (e.g. `?contains=foo`)
///
/// Limitations:
/// - Single-field filtering (no structured query support)
/// - No pagination, sorting, or advanced filtering
#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct PurchaseOrderListQuery {
    pub contains: Option<String>,
}
