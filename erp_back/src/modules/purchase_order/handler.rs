use axum::{
    extract::{Path,Query},
    http::StatusCode,
    Json,
};

use crate::modules::purchase_order::{
    dto::{
        PurchaseOrderListQuery, 
        response::PurchaseOrderResponse,
        create::CreatePurchaseOrderDto,
        update::PatchPurchaseOrderDto
    },
    service,
    errors
};

/// HTTP handler for listing purchase orders.
///
/// Endpoint:
/// - GET /purchase_orders
///
/// Query params:
/// - `contains`: optional filter string
///
/// Behavior:
/// - Extracts query parameters
/// - Delegates to service layer
/// - Returns JSON response
///
/// Error handling:
/// - Maps all service errors to `500 Internal Server Error`
pub async fn list_purchase_orders(
    Query(query): Query<PurchaseOrderListQuery>,
) -> Result<Json<Vec<PurchaseOrderResponse>>,StatusCode> {
    let result = service::list_purchase_orders(query).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(result))
}

/// HTTP handler for retrieving a single purchase order by ID.
///
/// Endpoint:
/// - GET /purchase_orders/{id}
///
/// Behavior:
/// - Extracts path parameter
/// - Delegates to service layer
/// - Returns JSON if found
///
/// Returns:
/// - 200 OK with JSON body if found
/// - 404 Not Found if no matching order exists
/// - 500 Internal Server Error on failure
pub async fn get_purchase_order(
    Path(id): Path<i32>
) -> Result<Json<PurchaseOrderResponse>, StatusCode> {
    let result= service::get_purchase_order(id).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    match result {
        Some(result) => Ok(Json(result)),
        None => Err(StatusCode::NOT_FOUND)
    }
}

/// HTTP handler for creating a new purchase order.
///
/// Endpoint:
/// - POST /purchase_orders
///
/// Behavior:
/// - Deserializes request body into DTO
/// - Delegates creation to service layer
/// - Returns created resource
///
/// Returns:
/// - 200 OK with created purchase order
/// - 500 Internal Server Error on failure
///
/// Notes:
/// - Does not yet distinguish validation errors from internal errors
pub async fn create_purchase_order(
    Json(payload): Json<CreatePurchaseOrderDto>,
) -> Result<Json<PurchaseOrderResponse>, StatusCode> {
    let order = service::create_purchase_order(payload)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(order))
}

/// HTTP handler for partially updating a purchase order.
///
/// Endpoint:
/// - PATCH /purchase_orders/{id}
///
/// Behavior:
/// - Extracts path parameter and request body
/// - Delegates update to service layer
/// - Returns updated resource if successful
///
/// Returns:
/// - 200 OK with updated purchase order
/// - 400 Bad Request for validation errors
/// - 404 Not Found if order or detail does not exist
/// - 500 Internal Server Error for other failures
///
/// Notes:
/// - Error mapping is partially implemented
/// - Relies on service layer to signal validation failures
pub async fn patch_purchase_order(
    Path(id): Path<i32>,
    Json(payload): Json<PatchPurchaseOrderDto>,
) -> Result<Json<PurchaseOrderResponse>, StatusCode> {
    //Gotta make a move to a town that's right for meeee
    //No wait, actually, gotta refactor most error handling in this file to properly use
    //the error enum in purchase_order::errors. But not today. Maybe tomorrow. Might be never :(
    let result = service::patch_purchase_order(id, payload)
        .await
        .map_err(|err| match err {
            errors::ServiceError::Validation(_) => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        })?;

    match result {
        Some(product) => Ok(Json(product)),
        None => Err(StatusCode::NOT_FOUND),
    }
}
