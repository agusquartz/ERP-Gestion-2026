// ============================================================
// SERVICE
// ============================================================
use crate::db_config::DbError;
use crate::modules::purchase_request::{
    dto::{
        create,
        response,
        update,
    },
    status,
    model,
    errors,
    mapper,
    repository,
};
use crate::modules::purchase_request::status::is_valid_transition;

// =============================================================================
// GET /purchase-requests
// =============================================================================

pub async fn list_purchase_requests(contains: Option<String>) -> Result<Vec<response::PurchaseRequestResponse>, errors::ServiceError> {
    let rows= repository::query_requests(contains.as_deref()).await?;
    Ok(rows.into_iter().map(|inv| response::PurchaseRequestResponse::from(inv)).collect())
}

// =============================================================================
// GET /purchase-requests/:id
// =============================================================================

pub async fn get_purchase_request(
    id: i32,
) -> Result<Option<response::PurchaseRequestResponse>, DbError> {

    let aggregate = repository::query_purchase_request_by_id(id).await?;
    Ok(aggregate.map(mapper::map_purchase_request))
}

// =============================================================================
// POST /purchase-requests
// =============================================================================

pub async fn create_purchase_request(dto: create::CreatePurchaseRequestDto) -> Result<response::PurchaseRequestResponse, errors::ServiceError> {

    // Transform DTO lines into domain model
    let mut details: Vec<model::NewPurchaseRequestLine> = Vec::new();
    for line in dto.details {
        let item = model::NewPurchaseRequestLine {
            product_id: line.product_id,
            quantity: line.quantity,
        };
        //store in details vector
        details.push(item);
    }


    // Build domain object
    let order = model::NewPurchaseRequest {
        created_at: dto.created_at,
        employee_id: dto.employee_id,
        details: details
    };

    // Persist and map result
    let aggregate = repository::store_new_request(order).await?; 
    let response = response::PurchaseRequestResponse::from(aggregate);
    Ok(response)

}

// =============================================================================
// POST /purchase-quotes
// =============================================================================

pub async fn create_purchase_quote(
    dto: create::CreatePurchaseQuoteDto,
) -> Result<response::PurchaseRequestResponse, errors::ServiceError> {

    if dto.details.is_empty() {
        return Err(errors::ServiceError::Validation(
                errors::ValidationError {
                    context: String::from("quote details can't be empty")
                }
        ));
    }
    // Validate the purchase request exists before creating a quote for it.
    // Gives a clear NotFound instead of an opaque FK constraint error.
    let exists = repository::query_purchase_request_by_id(dto.purchase_request_id).await?;
    if exists.is_none() {
        return Err(errors::ServiceError::Database(DbError::NotFound));
    }

    //This should be correct for a newly created quote with details
    let new_quote = mapper::map_create_quote(dto, status::STATUS_UNSENT);


    let aggregate = repository::store_purchase_quote(new_quote).await?;

    let request = response::PurchaseRequestResponse::from(aggregate);
    Ok(request)
}

// =============================================================================
// PATCH /purchase-quotes/:id
// =============================================================================

/// Updates the status of a supplier quote.
///
/// Fetches the current status first, then validates the transition.
/// Rejects any transition that goes backwards or skips a state.
///
/// date_sent and date_received are set automatically in the repository
/// based on the target status — the frontend never sends these.
///
/// Receives:
///   id  — purchase_quotes.id
///   dto — PatchPurchaseQuoteDto { status_id }
///
/// Returns:
///   Some(PatchPurchaseQuoteResponse) with the updated fields
///   None if the quote doesn't exist
///
/// Errors:
///   DbError::Other if the transition is invalid
///   DbError for any other database failure
pub async fn patch_purchase_quote(
    purchase_request_id: i32,
    dto: update::PatchPurchaseQuoteDto,
) -> Result<response::PurchaseRequestResponse, errors::ServiceError> {

    // Fetch current status — also validates the quote exists
    let Some(agg) = 
        repository::query_purchase_request_by_id(purchase_request_id).await?
    else {
        return Err(errors::ServiceError::NotFound( 
                errors::Context { entity: "purchase request", id: Some(purchase_request_id) }
        ));
    };

    let Some(quote) =
        agg.quotes.iter().find(|q| q.id == dto.quote_id)
    else {
        return Err(errors::ServiceError::NotFound(
                errors::Context { entity: "quote", id: Some(dto.quote_id) }
        ));
    };

    let current_status = quote.status.id;

    // Reject invalid transitions before touching the DB
    if !is_valid_transition(current_status, dto.status_id) {
        return Err(
            errors::ServiceError::Validation( 
                errors::ValidationError {
                    context: format!( "Invalid status transition: {} → {}. Only forward transitions are allowed.",
                                 current_status, dto.status_id) 
                }
            )
        );
    }
    //If we're transitioning from either created or unsent to pending, check for date_sent
    if dto.status_id == status::STATUS_PENDING && ( current_status == status::STATUS_UNSENT || current_status == status::STATUS_CREATED)&& dto.date_sent.is_none() {
        return Err(
            errors::ServiceError::Validation(
                errors::ValidationError {
                    context: format!("Can't send without date_sent field")
                }
            )
        );
    }


    //If we're going to ok, then check for date_received
    if dto.status_id == status::STATUS_OK && current_status != status::STATUS_OK && dto.date_received.is_none() {
        return Err(
            errors::ServiceError::Validation(
                errors::ValidationError {
                    context: format!("Can't receive without date_received field")
                }
            )
        );
    }

    //Probably should also check that the dates are in good order
    let aggregate = repository::patch_purchase_quote(purchase_request_id, dto).await?;
    Ok(mapper::map_purchase_request(aggregate))
}

