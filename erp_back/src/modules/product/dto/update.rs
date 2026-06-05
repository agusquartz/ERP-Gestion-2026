use serde::{Deserialize, Serialize};

/// DTO used for partial updates of a product.
///
/// Used in `PATCH /products/{id}`.
/// All fields are optional to allow partial modifications.
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PatchProductDto {
    pub code: Option<String>,
    pub description: Option<String>,
    pub cost: Option<f64>,
    pub price: Option<f64>,
    pub stock: Option<i32>,
    pub category_id: Option<i32>,

    /// Optional nested option:
    /// - None → do not update
    /// - Some(None) → remove brand
    /// - Some(Some(id)) → set brand
    pub brand_id: Option<Option<i32>>,

    /// Replace full tax list (not incremental update)
    pub tax_ids: Option<Vec<i32>>,
    
    pub is_active: Option<bool>,
}

impl PatchProductDto {
    /// Checks whether the DTO contains any update fields.
    ///
    /// Returns `true` if no field was provided.
    ///
    /// Useful to prevent empty PATCH requests.
    pub fn is_empty(&self) -> bool {
        self.code.is_none()
            && self.description.is_none()
            && self.cost.is_none()
            && self.price.is_none()
            && self.stock.is_none()
            && self.category_id.is_none()
            && self.brand_id.is_none()
            && self.tax_ids.is_none()
            && self.is_active.is_none()
    }
}