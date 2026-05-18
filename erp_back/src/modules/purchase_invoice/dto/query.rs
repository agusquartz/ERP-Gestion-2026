use serde::{Deserialize, Serialize};
use chrono::NaiveDate;

/// Query parameters for GET /purchases/purchase-invoices.
///
/// # Fields
/// - `search`: case-insensitive match against invoice number or supplier name
/// - `filter`: exact match against purchase order number
/// - `status`: payment status — `paid`, `partial_payment`, `payment_pending`
/// - `from` / `to`: date range bounds on `created_at`
/// - `cursor`: last `id` of the previous page for cursor pagination; omit for page 1
/// - `limit`: page size, defaults to 30
///
/// # Example
/// `?search=TechSolutions&filter=188&status=paid&from=2026-01-01&cursor=60&limit=30`
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurchaseInvoicesListQuery {
    pub search: Option<String>,
    pub filter: Option<String>,
    pub status: Option<String>,
    pub since:  Option<NaiveDate>,
    pub to:     Option<NaiveDate>,
    pub cursor: Option<i32>,
    #[serde(default = "default_limit")]
    pub limit:  i64,
}

fn default_limit() -> i64 { 30 }