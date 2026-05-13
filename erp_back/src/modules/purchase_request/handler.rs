

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
            SaveQuoteDetailsDto,
            CreatePurchaseRequestDto,
        },
        update::PatchPurchaseQuoteDto,
        response::PurchaseRequestResponse,
    },
    service,
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
) -> Result<Json<PurchaseRequestResponseDto>, (StatusCode, String)> {
    match service::get_purchase_request_by_id(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::NOT_FOUND,
            e.to_string(),
        )),
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

// =============================================================================
// POST /purchase-quotes/:id/details
// =============================================================================

/// Handles POST /purchase-quotes/:id/details
///
/// Saves confirmed quantities and unit costs for a supplier quote.
/// Replaces all existing details atomically (DELETE + INSERT in transaction).
///
/// Path params:
///   id — purchase_quotes.id
///
/// Body: SaveQuoteDetailsDto { details: Vec<QuoteDetailLine> }
///
/// Responses:
///   200 OK — SaveQuoteDetailsResponse (JSON)
///   500    — Database error or transaction failure
pub async fn save_quote_details(
    Path(id): Path<i32>,
    Json(body): Json<SaveQuoteDetailsDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {

    match service::save_quote_details(id, body).await {
        Ok(response) => Ok((StatusCode::OK, Json(response))),
        Err(e)       => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

