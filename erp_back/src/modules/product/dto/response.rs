use serde::{Deserialize, Serialize};

use crate::modules::product::model;

/// Category data returned inside ProductResponse
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryResponse {
    pub id: i32,
    pub name: String,
}

/// Brand data returned inside ProductResponse (optional)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrandResponse {
    pub id: i32,
    pub name: String,
}

/// Tax data returned inside ProductResponse
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaxResponse {
    pub id: i32,
    pub name: String,
    pub percentage: f64,
}

/// Main API response for a product.
///
/// This is a fully denormalized representation built from
/// `ProductAggregate`, including category, brand, and taxes.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductResponse {
    pub id: i32,
    pub code: String,
    pub description: String,
    pub cost: f64,
    pub price: f64,
    pub stock: i32,
    pub is_active: bool,
    pub category: CategoryResponse,
    pub brand: Option<BrandResponse>,
    pub taxes: Vec<TaxResponse>,
}

/// Converts a ProductAggregate into a ProductResponse.
///
/// This mapping flattens database/domain structures into
/// a clean API response format.
impl From<model::ProductAggregate> for ProductResponse {
    fn from(value: model::ProductAggregate) -> Self {
        Self {
            id: value.product.id,
            code: value.product.code,
            description: value.product.description,
            cost: value.product.cost,
            price: value.product.price,
            stock: value.product.stock,
            is_active: value.product.is_active,
            category: CategoryResponse {
                id: value.category.id,
                name: value.category.name,
            },
            brand: value.brand.map(|b| BrandResponse { id: b.id, name: b.name }),
            taxes: value
                .taxes
                .into_iter()
                .map(|t| TaxResponse {
                    id: t.id,
                    name: t.name,
                    percentage: t.percentage,
                })
                .collect(),
        }
    }
}