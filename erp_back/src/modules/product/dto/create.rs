use serde::{Deserialize, Serialize};

/// DTO used to create a new product.
///
/// This structure represents the incoming request payload
/// for `POST /products`.
///
/// All required business fields must be provided here.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProductDto {
    pub code: String,
    pub description: String,
    pub cost: f64,
    pub price: f64,
    pub category_id: i32,
    pub brand_id: Option<i32>,
    pub tax_ids: Option<Vec<i32>>,
    pub is_active: Option<bool>,
}