use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Json,
};

use crate::modules::product::{
    dto::{
        PatchProductDto, 
        ProductListQuery, 
        ProductResponse,
        response::{
            ListProductView,
        },
    },
    service,
};

/// GET /products
/// GET /products?contains=string
pub async fn list_products(
    Query(query): Query<ProductListQuery>,
) -> Result<Json<ListProductView>, (StatusCode, String)> {
    let result = service::list_products(query)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

/// GET /products/{id}
pub async fn get_product(
    Path(id): Path<i32>,
) -> Result<Json<ProductResponse>, StatusCode> {
    let result = service::get_product(id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match result {
        Some(product) => Ok(Json(product)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// PATCH /products/{id}
pub async fn patch_product(
    Path(id): Path<i32>,
    Json(payload): Json<PatchProductDto>,
) -> Result<Json<ProductResponse>, StatusCode> {
    let result = service::patch_product(id, payload)
        .await
        .map_err(|err| match err {
            service::ServiceError::Validation(_) => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        })?;

    match result {
        Some(product) => Ok(Json(product)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

// GET /products/code/{code}
pub async fn get_product_by_code(
    Path(code): Path<String>,
) -> Result<Json<ProductResponse>, StatusCode> {
    let result = service::get_product_by_code(code)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match result {
        Some(product) => Ok(Json(product)),
        None => Err(StatusCode::NOT_FOUND),
    }
}
