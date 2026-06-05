use serde::{ Deserialize, Serialize };
use chrono::NaiveDate;

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
    pub search: Option<String>,
    pub filter: Option<String>,
    pub status: Option<String>,
    pub since: Option<NaiveDate>,
    pub to: Option<NaiveDate>,
    pub cursor: Option<i32>,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

fn default_limit()-> i64 { 30 }
