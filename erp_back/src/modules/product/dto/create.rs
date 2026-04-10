use serde::{Deserialize, Serialize};

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