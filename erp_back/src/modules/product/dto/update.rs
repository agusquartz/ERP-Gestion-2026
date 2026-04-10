use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PatchProductDto {
    pub code: Option<String>,
    pub description: Option<String>,
    pub cost: Option<f64>,
    pub price: Option<f64>,
    pub category_id: Option<i32>,
    pub brand_id: Option<Option<i32>>,
    pub tax_ids: Option<Vec<i32>>,
    pub is_active: Option<bool>,
}

impl PatchProductDto {
    pub fn is_empty(&self) -> bool {
        self.code.is_none()
            && self.description.is_none()
            && self.cost.is_none()
            && self.price.is_none()
            && self.category_id.is_none()
            && self.brand_id.is_none()
            && self.tax_ids.is_none()
            && self.is_active.is_none()
    }
}