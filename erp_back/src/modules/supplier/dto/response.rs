use serde::{Deserialize, Serialize};

use crate::modules::supplier::model;

/// Category returned inside SupplierResponse.
///
/// Example:
/// {
///   "id": 1,
///   "name": "Lubricants"
/// }
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierCategoryResponse {
    pub id: i32,
    pub name: String,
}

/// Main supplier API response.
///
/// This is a denormalized response built from `SupplierAggregate`.
///
/// Example:
/// {
///   "id": 1,
///   "name": "ACME Supplier",
///   "address": "Some address",
///   "email": "sales@acme.com",
///   "isActive": true,
///   "creditLimit": 5000000,
///   "currCredit": 1200000,
///   "categories": [
///     { "id": 1, "name": "Oils" },
///     { "id": 2, "name": "Filters" }
///   ]
/// }
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierResponse {
    pub id: i32,
    pub name: String,
    pub address: Option<String>,
    pub email: String,
    pub is_active: bool,
    pub credit_limit: f64,
    pub curr_credit: f64,
    pub categories: Vec<SupplierCategoryResponse>,
}

impl From<model::Category> for SupplierCategoryResponse {
    fn from(value: model::Category) -> Self {
        Self {
            id: value.id,
            name: value.name,
        }
    }
}

impl From<model::SupplierAggregate> for SupplierResponse {
    fn from(value: model::SupplierAggregate) -> Self {
        Self {
            id: value.supplier.id,
            name: value.supplier.name,
            address: value.supplier.address,
            email: value.supplier.email,
            is_active: value.supplier.is_active,
            credit_limit: value.supplier.credit_limit,
            curr_credit: value.supplier.curr_credit,
            categories: value
                .categories
                .into_iter()
                .map(SupplierCategoryResponse::from)
                .collect(),
        }
    }
}