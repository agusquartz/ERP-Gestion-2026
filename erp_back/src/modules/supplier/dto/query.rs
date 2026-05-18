use serde::{Deserialize, Serialize};

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
    pub contains: Option<String>,

    /// Supports repeated query params:
    /// ?categories=1&categories=2
    ///
    /// Also accepts:
    /// ?categories[]=1&categories[]=2
    #[serde(default, alias = "categories[]")]
    pub categories: Vec<i32>,
}