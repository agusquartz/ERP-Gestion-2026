use serde::{Deserialize, Serialize};
use chrono::NaiveDate;

/// Query parameters for listing suppliers.
///
/// Examples:
///
/// GET /suppliers?contains=acme
/// GET /suppliers?categories=1&categories=2
/// GET /suppliers?categories[]=1&categories[]=2
/// GET /suppliers?contains=acme&categories=1&categories=2
///
/// `categories` means:
/// - return suppliers that contain ALL requested categories.
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierListQuery {
    pub search: Option<String>,
    pub filter: Option<String>,
    pub status: Option<String>,
    pub since: Option<NaiveDate>,
    pub to: Option<NaiveDate>,
    pub cursor: Option<i32>,
    #[serde(default = "default_limit")]
    pub limit: i64,

    /// Supports repeated query params:
    /// ?categories=1&categories=2
    ///
    /// Also accepts:
    /// ?categories[]=1&categories[]=2
    #[serde(default, alias = "categories[]")]
    pub categories: Vec<i32>,
}

fn default_limit()-> i64 { 30 }
