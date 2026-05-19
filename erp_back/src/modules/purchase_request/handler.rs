use axum::{
    extract::{Json, Path, Query, Extension},
    http::StatusCode,
    response::IntoResponse,
};

use crate::db_config::DbError;
use crate::modules::auth::middleware::jwt::Claims;
use crate::modules::purchase_request::{
    dto::{
        PurchaseRequestListQuery,
        create::{
            CreatePurchaseQuoteDto, 
            CreatePurchaseRequestDto,
        },
        update::PatchPurchaseQuoteDto,
        response::PurchaseRequestResponse,
    },
    service,
    errors,
};

/// Retrieves a list of purchase requests.
///
/// Supports optional filtering via `contains`, delegated to the service layer.
/// Returns HTTP 500 on unexpected service errors.
pub async fn list_purchase_requests(
    Query(query): Query<PurchaseRequestListQuery>,
) -> Result<Json<Vec<PurchaseRequestResponse>>,StatusCode> {
    let result = service::list_purchase_requests(query.contains).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(result))
}

/// Retrieves a purchase request by ID.
///
/// Returns:
/// - 200 with payload if found
/// - 404 if not found
/// - 500 for unexpected errors
pub async fn get_purchase_request(
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    match service::get_purchase_request(id).await {
        Ok(Some(response)) => Ok((StatusCode::OK, Json(response))),
        Ok(None)           => Err((StatusCode::NOT_FOUND, format!("Purchase request {} not found", id))),
        Err(e)             => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

/// Creates a new purchase request for the authenticated employee.
///
/// The employee identity is extracted from JWT claims.
/// Returns 200 with the created resource or 500 on failure.
pub async fn create_purchase_request(
    Extension(claim): Extension<Claims>,
    Json(payload): Json<CreatePurchaseRequestDto>,
) -> Result<Json<PurchaseRequestResponse>, StatusCode> {
    let employee_name = claim.sub;
    let request = service::create_purchase_request(employee_name, payload)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(request))
}

/// Creates a new purchase quote linked to a purchase request.
///
/// Possible responses:
/// - 201 if creation succeeds
/// - 404 if purchase request does not exist
/// - 500 for unexpected errors
pub async fn create_purchase_quote(
    Json(body): Json<CreatePurchaseQuoteDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {

    match service::create_purchase_quote(body).await {
        Ok(response)           => Ok((StatusCode::CREATED, Json(response))),
        Err(errors::ServiceError::Database(DbError::NotFound)) => Err((StatusCode::NOT_FOUND, "Purchase request not found".to_string())),
        Err(e)                 => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

/// Updates status and lifecycle fields of a purchase quote.
///
/// Enforces business rules such as:
/// - valid status transitions
/// - required timestamps for specific transitions
///
/// Returns:
/// - 200 if update succeeds
/// - 404 if purchase request or quote is missing
/// - 400 for validation failures
/// - 500 for unexpected errors
pub async fn patch_purchase_quote(
    Path(req_id): Path<i32>,
    Json(body): Json<PatchPurchaseQuoteDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {

    match service::patch_purchase_quote(req_id,body).await {
        Ok(response)     => Ok((StatusCode::OK, Json(response))),

        Err(errors::ServiceError::NotFound(errors::Context{ entity, id })) => {
            let message = match id {
                Some(id) => format!("{entity} {id} not found!"),
                None => format!("{entity} not found"),
            };

            Err((StatusCode::NOT_FOUND, message))
        },

        Err(errors::ServiceError::Validation(err)) => {
            Err((StatusCode::BAD_REQUEST, err.context))
        },

        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

