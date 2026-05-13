// ============================================================
// SERVICE
// ============================================================
use crate::db_config::DbError;
use crate::modules::purchase_request::{
    dto::{
        create::{
            CreatePurchaseQuoteDto, 
            SaveQuoteDetailsDto,
            CreatePurchaseRequestDto,
        },
        response::{
            CreatePurchaseQuoteResponse,
            UpdatePurchaseQuoteResponse,
            PurchaseRequestResponse,
            SaveQuoteDetailsResponse,
        },
        update::PatchPurchaseQuoteDto,
    },
    model::{
        NewPurchaseRequest,
        NewPurchaseRequestLine,
    },
    errors,
    mapper,
    repository,
};
use crate::modules::purchase_request::status::is_valid_transition;


pub async fn list_purchase_requests(contains: Option<String>) -> Result<Vec<PurchaseRequestResponse>, errors::ServiceError> {
    let rows= repository::query_requests(contains.as_deref()).await?;
    Ok(rows.into_iter().map(|inv| PurchaseRequestResponse::from(inv)).collect())
}
// =============================================================================
// GET /purchase-requests/:id
// =============================================================================

/// Creates a new purchase request.
///
/// Behavior:
/// - Transforms DTO into domain creation model
/// - Delegates persistence to repository layer
/// - Returns created purchase order as response DTO
///
/// Limitations:
/// - Does not validate:
///   - duplicate product IDs
///   - positive quantities
///   - supplier existence
///   - purchase request validity
///
pub async fn create_purchase_request(dto: CreatePurchaseRequestDto) -> Result<PurchaseRequestResponse, errors::ServiceError> {

    // Transform DTO lines into domain model
    let mut details: Vec<NewPurchaseRequestLine> = Vec::new();
    for line in dto.details {
        let item = NewPurchaseRequestLine {
            product_id: line.product_id,
            quantity: line.quantity,
        };
        //store in details vector
        details.push(item);
    }


    // Build domain object
    let order = NewPurchaseRequest {
        created_at: dto.created_at,
        employee_id: dto.employee_id,
        details: details
    };

    // Persist and map result
    let aggregate = repository::store_new_request(order).await?; 
    let response = PurchaseRequestResponse::from(aggregate);
    Ok(response)

}

// =============================================================================
// POST /purchase-quotes
// =============================================================================


pub async fn get_purchase_request_by_id(
    id: i32,
) -> Result<PurchaseRequestResponseDto, DbError> {
    let data = repository::get_purchase_request_by_id(id)
        .await?
        .ok_or(DbError::NotFound)?;

    Ok(mapper::purchase_request_to_response(data))
}

pub async fn get_purchase_requests(
    contains: Option<String>,
) -> Result<Vec<PurchaseRequestResponseDto>, DbError> {
    let data = repository::get_purchase_requests(contains).await?;

    Ok(data
        .into_iter()
        .map(mapper::purchase_request_to_response)
        .collect())
}

pub async fn search_products(
    contains: Option<String>,
) -> Result<Vec<ProductSearchResponseDto>, DbError> {
    let data = repository::search_products(contains).await?;

    Ok(data
        .into_iter()
        .map(mapper::product_search_to_response)
        .collect())
}
