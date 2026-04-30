use crate::modules::product;
use crate::modules::product::dto::ProductResponse;
use crate::modules::purchase_order::{
    repository,
    model::{
        new_order_model::{
            NewPurchaseOrder,
            NewPurchaseOrderLine
        }
    }, 
    dto::{
        response::PurchaseOrderResponse,
        create::CreatePurchaseOrderDto,
        update::PatchPurchaseOrderDto
    },
    errors
};

/// Lists purchase orders, optionally filtered by a search term.
///
/// Behavior:
/// - Delegates retrieval to repository layer
/// - Maps domain aggregates into response DTOs
///
/// Notes:
/// - This function performs no business validation
/// - Filtering semantics are defined at the repository level
pub async fn list_purchase_orders(contains: Option<String>) -> Result<Vec<PurchaseOrderResponse>, errors::ServiceError> {
    let rows= repository::query_orders(contains.as_deref()).await?;
    Ok(rows.into_iter().map(|inv| PurchaseOrderResponse::from(inv)).collect())
}

/// Retrieves a single purchase order by ID.
///
/// Returns:
/// - `Ok(Some(...))` if found
/// - `Ok(None)` if not found
///
/// Behavior:
/// - Delegates retrieval to repository layer
/// - Maps result into response DTO
///
/// Notes:
/// - No additional validation or transformation is applied
pub async fn get_purchase_order(id: i32) -> Result<Option<PurchaseOrderResponse>, errors::ServiceError> {
    let order = repository::query_purchase_order_by_id(id).await?;
    Ok(order.map(|inv| PurchaseOrderResponse::from(inv)))
}

/// Creates a new purchase order.
///
/// Behavior:
/// - Validates that all referenced products exist
/// - Transforms DTO into domain creation model
/// - Delegates persistence to repository layer
/// - Returns created purchase order as response DTO
///
/// Validation:
/// - Ensures each `product_id` exists via product service
///
/// Limitations:
/// - Does not validate:
///   - duplicate product IDs
///   - positive quantities
///   - supplier existence
///   - purchase request validity
///
/// Notes:
/// - Product existence checks are performed sequentially (not batched)
/// - Assumes DTO contains at least one detail
pub async fn create_purchase_order(dto: CreatePurchaseOrderDto) -> Result<PurchaseOrderResponse, errors::ServiceError> {
    //check every product exists
    for line in &dto.details {
        let p: ProductResponse = product::service::get_product(line.product_id)
            .await?
            .ok_or(errors::ServiceError::Validation( errors::ValidationError{
                context: format!("missing product {}", line.product_id)
            }))?;
    }

    // Transform DTO lines into domain model
    let mut details: Vec<NewPurchaseOrderLine> = Vec::new();
    for line in dto.details {
        let item = NewPurchaseOrderLine {
            product_id: line.product_id,
            ordered_quantity: line.ordered_quantity,
        };
        //store in details vector
        details.push(item);
    }


    // Build domain object
    let order = NewPurchaseOrder {
        created_at: dto.created_at,
        purchase_request_id: dto.purchase_request_id,
        supplier_id: dto.supplier_id,
        details: details
    };

    // Persist and map result
    let aggregate = repository::store_new_order(order).await?; 
    let response = PurchaseOrderResponse::from(aggregate);
    Ok(response)

}

/// Applies a partial update to a purchase order.
///
/// Behavior:
/// - Delegates update logic entirely to repository layer
/// - Maps result into response DTO
///
/// Returns:
/// - `Ok(Some(...))` if update succeeded
/// - `Ok(None)` if order does not exist or update failed due to invalid detail
///
/// Limitations:
/// - No validation is performed at this layer:
///   - Does not verify status transitions
///   - Does not validate received quantities
///   - Does not check consistency of patch payload
///
/// Notes:
/// - Relies on repository for transactional guarantees and correctness 
pub async fn patch_purchase_order(
    id: i32,
    patch: PatchPurchaseOrderDto,
) -> Result<Option<PurchaseOrderResponse>, errors::ServiceError> {
    let order = repository::patch_purchase_order(id, &patch).await?;
    Ok(order.map(PurchaseOrderResponse::from))
}
