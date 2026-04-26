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

pub async fn list_purchase_orders(
    Query(query): Query<PurchaseOrderListQuery>,
) -> Result<Json<Vec<PurchaseOrderResponse>>,StatusCode> {
    let result = service::list_purchase_orders(query.contains).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(result))
}

pub async fn get_purchase_order(
    Path(id): Path<i32>
) -> Result<Json<PurchaseOrderResponse>, StatusCode> {
    let result= service::get_purchase_order(id).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    match result {
        Some(result) => Ok(Json(result)),
        None => Err(StatusCode::NOT_FOUND)
    }
}

pub async fn create_purchase_order(
    Json(payload): Json<CreatePurchaseOrderDto>,
) -> Result<Json<PurchaseOrderResponse>, StatusCode> {
    let order = service::create_purchase_order(payload)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(order))
}

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
