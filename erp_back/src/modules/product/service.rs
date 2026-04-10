use crate::modules::product::dto::{ProductResponse, PatchProductDto};
use crate::modules::product::repository;
use crate::shared::db_config;

/// Service-level error type for product operations.
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

/// Returns a list of products.
///
/// If `contains` is provided, filters products by code or description.
/// Otherwise, returns all products.
pub async fn list_products(contains: Option<String>) -> Result<Vec<ProductResponse>, ServiceError> {
    let rows = repository::query_products(contains.as_deref()).await?;
    Ok(rows.into_iter().map(ProductResponse::from).collect())
}

/// Retrieves a single product by its ID.
///
/// Returns:
/// - `Ok(Some(product))` if found
/// - `Ok(None)` if the product does not exist
pub async fn get_product(id: i32) -> Result<Option<ProductResponse>, ServiceError> {
    let product = repository::query_product_by_id(id).await?;
    Ok(product.map(ProductResponse::from))
}

/// Partially updates a product.
///
/// Applies only the fields provided in `PatchProductDto`.
///
/// # Errors
///
/// - Returns `Validation` error if the patch is empty
/// - Returns `Db` error if the database operation fails
///
/// # Returns
///
/// - `Ok(Some(product))` if updated successfully
/// - `Ok(None)` if the product does not exist
pub async fn patch_product(
    id: i32,
    patch: PatchProductDto,
) -> Result<Option<ProductResponse>, ServiceError> {
    if patch.is_empty() {
        return Err(ServiceError::Validation(
            "patch body cannot be empty".to_string(),
        ));
    }

    let product = repository::patch_product(id, &patch).await?;
    Ok(product.map(ProductResponse::from))
}