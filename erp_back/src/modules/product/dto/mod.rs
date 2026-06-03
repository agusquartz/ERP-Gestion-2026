pub mod create;
pub mod response;
pub mod update;

pub use create::CreateProductDto;
pub use response::{BrandResponse, CategoryResponse, ProductResponse, TaxResponse};
pub use update::PatchProductDto;

use serde::{Deserialize, Serialize};
use chrono::NaiveDate;

/// Query parameters for listing products.
///
/// Used in `GET /products`.
/// Supports optional filtering.
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct ProductListQuery {
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
