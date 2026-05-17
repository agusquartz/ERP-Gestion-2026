use axum::{
    extract::{Json, Path, Query},
    http::StatusCode,
};

use crate::db_config::DbError;
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

pub async fn list_purchase_requests(
    Query(query): Query<PurchaseRequestListQuery>,
) -> Result<Json<Vec<PurchaseRequestResponse>>,StatusCode> {
    let result = service::list_purchase_requests(query.contains).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(result))
}


/// GET /purchase-requests/{id}
///
/// Obtiene una solicitud de compra específica.
pub async fn get_purchase_request_handler(
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    match service::get_purchase_request(id).await {
        Ok(Some(response)) => Ok((StatusCode::OK, Json(response))),
        Ok(None)           => Err((StatusCode::NOT_FOUND, format!("Purchase request {} not found", id))),
        Err(e)             => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

/// Creates a new purchase_request.
///
/// # Endpoint
/// POST /purchase-requests
///
/// # Body
/// JSON `CreatePurchaseRequestDto`
///
/// # Returns
/// - 200 with created request
pub async fn create_purchase_request(
    Json(payload): Json<CreatePurchaseRequestDto>,
) -> Result<Json<PurchaseRequestResponse>, StatusCode> {
    let request = service::create_purchase_request(payload)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(request))
}
// =============================================================================
// POST /purchase-quotes
// =============================================================================

/// Handles POST /purchase-quotes
///
/// Creates a new supplier quote for a purchase request.
/// Triggered when the user confirms a supplier in SupplierSearchModal.
///
/// Body: CreatePurchaseQuoteDto { purchase_request_id, supplier_id }
///
/// Responses:
///   201 Created — CreatePurchaseQuoteResponse (JSON)
///   404         — Purchase request not found
///   500         — Database error
pub async fn create_purchase_quote(
    Json(body): Json<CreatePurchaseQuoteDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {

    match service::create_purchase_quote(body).await {
        Ok(response)           => Ok((StatusCode::CREATED, Json(response))),
        Err(errors::ServiceError::Database(DbError::NotFound)) => Err((StatusCode::NOT_FOUND, "Purchase request not found".to_string())),
        Err(e)                 => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

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

