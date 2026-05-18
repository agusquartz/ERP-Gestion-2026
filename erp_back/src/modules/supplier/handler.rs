use axum::{
    extract::Path,
    http::StatusCode,
    Json,
};

use axum_extra::extract::Query;

use crate::modules::supplier::{
    dto::{
        SupplierCategoryResponse,
        SupplierListQuery,
        SupplierResponse,
    },
    service,
};

fn map_service_error(err: service::ServiceError) -> StatusCode {
    match err {
        service::ServiceError::Validation(_) => StatusCode::BAD_REQUEST,
        service::ServiceError::Db(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

/// GET /suppliers
/// GET /suppliers?contains=string
/// GET /suppliers?categories=1&categories=2
/// GET /suppliers?contains=string&categories=1&categories=2
pub async fn list_suppliers(
    Query(query): Query<SupplierListQuery>,
) -> Result<Json<Vec<SupplierResponse>>, StatusCode> {
    let result = service::list_suppliers(query)
        .await
        .map_err(map_service_error)?;

    Ok(Json(result))
}

/// GET /suppliers/{id}
pub async fn get_supplier(
    Path(id): Path<i32>,
) -> Result<Json<SupplierResponse>, StatusCode> {
    let result = service::get_supplier(id)
        .await
        .map_err(map_service_error)?;

    match result {
        Some(supplier) => Ok(Json(supplier)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// GET /suppliers/{id}/categories
pub async fn list_supplier_categories(
    Path(id): Path<i32>,
) -> Result<Json<Vec<SupplierCategoryResponse>>, StatusCode> {
    let result = service::list_supplier_categories(id)
        .await
        .map_err(map_service_error)?;

    match result {
        Some(categories) => Ok(Json(categories)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// GET /categories
///
/// This is useful for frontend filters.
pub async fn list_categories(
) -> Result<Json<Vec<SupplierCategoryResponse>>, StatusCode> {
    let result = service::list_categories()
        .await
        .map_err(map_service_error)?;

    Ok(Json(result))
}