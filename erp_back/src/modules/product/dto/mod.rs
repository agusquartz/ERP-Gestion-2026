pub mod create;
pub mod response;
pub mod update;

pub use create::CreateProductDto;
pub use response::{BrandResponse, CategoryResponse, ProductResponse, TaxResponse};
pub use update::PatchProductDto;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct ProductListQuery {
    pub contains: Option<String>,
}