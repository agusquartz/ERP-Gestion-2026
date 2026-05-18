use crate::modules::supplier::{
    dto::{
        SupplierCategoryResponse,
        SupplierListQuery,
        SupplierResponse,
    },
    repository,
};

use crate::shared::db_config;

/// Service-level error type for supplier operations.
///
/// Wraps database errors and domain validation errors.
#[derive(Debug)]
pub enum ServiceError {
    Db(db_config::DbError),
    Validation(String),
}

/// Converts a database error into a service error.
impl From<db_config::DbError> for ServiceError {
    fn from(value: db_config::DbError) -> Self {
        Self::Db(value)
    }
}

/// Formats the error for user-facing messages or logs.
impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::Db(_) => write!(f, "database error"),
            ServiceError::Validation(msg) => write!(f, "validation error: {msg}"),
        }
    }
}

impl std::error::Error for ServiceError {}

/// Returns a list of suppliers.
///
/// Supported filters:
/// - `contains`: searches by supplier name, email, or address.
/// - `categories`: filters suppliers that contain ALL requested categories.
///
/// Example:
/// GET /suppliers?contains=acme&categories=1&categories=2
pub async fn list_suppliers(
    query: SupplierListQuery,
) -> Result<Vec<SupplierResponse>, ServiceError> {
    let contains = query
        .contains
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);

    let mut category_ids = query.categories;

    if category_ids.iter().any(|id| *id <= 0) {
        return Err(ServiceError::Validation(
            "category ids must be positive numbers".to_string(),
        ));
    }

    category_ids.sort_unstable();
    category_ids.dedup();

    let suppliers = repository::query_suppliers(
        contains.as_deref(),
        &category_ids,
    )
    .await?;

    Ok(suppliers
        .into_iter()
        .map(SupplierResponse::from)
        .collect())
}

/// Retrieves a single supplier by its ID.
///
/// Returns:
/// - `Ok(Some(supplier))` if found
/// - `Ok(None)` if the supplier does not exist
pub async fn get_supplier(
    id: i32,
) -> Result<Option<SupplierResponse>, ServiceError> {
    if id <= 0 {
        return Err(ServiceError::Validation(
            "supplier id must be a positive number".to_string(),
        ));
    }

    let supplier = repository::query_supplier_by_id(id).await?;

    Ok(supplier.map(SupplierResponse::from))
}

/// Retrieves only the categories associated with a supplier.
///
/// Used by:
/// GET /suppliers/{id}/categories
///
/// Returns:
/// - `Ok(Some(categories))` if supplier exists
/// - `Ok(None)` if supplier does not exist
/// - `Ok(Some(vec![]))` if supplier exists but has no categories
pub async fn list_supplier_categories(
    supplier_id: i32,
) -> Result<Option<Vec<SupplierCategoryResponse>>, ServiceError> {
    if supplier_id <= 0 {
        return Err(ServiceError::Validation(
            "supplier id must be a positive number".to_string(),
        ));
    }

    let categories = repository::query_supplier_categories(supplier_id).await?;

    Ok(categories.map(|items| {
        items
            .into_iter()
            .map(SupplierCategoryResponse::from)
            .collect()
    }))
}

/// Retrieves all categories.
///
/// Useful for frontend filter options.
///
/// Used by:
/// GET /categories
pub async fn list_categories() -> Result<Vec<SupplierCategoryResponse>, ServiceError> {
    let categories = repository::query_categories().await?;

    Ok(categories
        .into_iter()
        .map(SupplierCategoryResponse::from)
        .collect())
}