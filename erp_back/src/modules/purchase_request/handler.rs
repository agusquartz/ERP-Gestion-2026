

use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Json,
};




use std::collections::HashMap;


use crate::modules::purchase_request::dto::create::CreatePurchaseRequestDto;
use crate::modules::purchase_request::dto::response::PurchaseRequestResponseDto;
use crate::modules::purchase_request::dto::search::ProductSearchResponseDto;


use crate::modules::purchase_request::service;


// ============================================================
// HANDLERS
// ============================================================


/// POST /purchase-requests
///
/// Crea una nueva solicitud de compra con sus detalles.
pub async fn create_purchase_request_handler(
    Json(payload): Json<CreatePurchaseRequestDto>,
) -> Result<Json<PurchaseRequestResponseDto>, (StatusCode, String)> {
    match service::create_purchase_request(payload).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            e.to_string(),
        )),
    }
}

/// GET /purchase-requests/{id}
///
/// Obtiene una solicitud de compra específica.
pub async fn get_purchase_request_handler(
    Path(id): Path<i32>,
) -> Result<Json<PurchaseRequestResponseDto>, (StatusCode, String)> {
    match service::get_purchase_request_by_id(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::NOT_FOUND,
            e.to_string(),
        )),
    }
}

/// GET /purchase-requests
/// GET /purchase-requests?contains=xxx
///
/// Lista solicitudes de compra.
/// Si recibe `contains`, filtra por empleado, producto, código o ID.
pub async fn list_purchase_requests_handler(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<PurchaseRequestResponseDto>>, (StatusCode, String)> {
    let contains = params.get("contains").cloned();

    match service::get_purchase_requests(contains).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            e.to_string(),
        )),
    }
}

/// GET /purchase-request-products
/// GET /purchase-request-products?contains=xxx
///
/// Lista productos para usarlos dentro de una solicitud de compra.
/// Esta es la función que probablemente necesitás para buscar productos
/// cuando estás cargando el detalle de la solicitud.
pub async fn list_products_for_purchase_request_handler(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<ProductSearchResponseDto>>, (StatusCode, String)> {
    let contains = params.get("contains").cloned();

    match service::search_products(contains).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            e.to_string(),
        )),
    }
}