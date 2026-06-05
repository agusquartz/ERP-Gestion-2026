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
        PurchaseOrderListQuery,
        response::{
            ListOrdersView,
            PurchaseOrderResponse,
        },
        create::CreatePurchaseOrderDto,
        update::PatchPurchaseOrderDto
    },
    errors,
};

/// Lists purchase orders, optionally filtered by a search term.
///
/// Behavior:
/// - Delegates retrieval to repository layer
/// - Maps domain aggregates into response DTOs
///
/// Notes:
/// - Filtering semantics are defined at the repository level
pub async fn list_purchase_orders(query: PurchaseOrderListQuery) -> Result<ListOrdersView, errors::ServiceError> {
    //validate the status string
    //discard invalid status before they reach repository
    let status = query.status
        .map(|s| s.to_uppercase())
        .filter(|status| { matches!(status.as_str(), "PENDING" | "PARTIAL" | "OK")
    });

    dbg!(&status);

    let rows= repository::query_orders(
        query.search, 
        query.filter, 
        query.since, 
        query.to, 
        status, 
        query.cursor, 
        query.limit + 1,
        ).await?;
    let mut orders: Vec<PurchaseOrderResponse> = rows.into_iter().map(PurchaseOrderResponse::from).collect();
    
    let limit = query.limit as usize;
    //check if there's more orders than what the limit allows us to return
    let has_more = orders.len() > limit; 
    //drop the extra order from the vector
    orders.truncate(limit);
    //create the list view
    let view = ListOrdersView {
        orders: orders,
        has_more: has_more,
    };

    Ok(view)
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


/// increments the received quantity of a product on a given order
///
/// Meant to be called from the invoice module, at the time it is created, 
/// so it also updates the order with which it is associated
pub async fn increase_received_quantity(
    tx: &tokio_postgres::Transaction<'_>,
    order_id: i32,
    product_id: i32,
    amount: i32,
) -> Result<(), errors::ServiceError> {
    if amount <= 0 {
        return Err(errors::ServiceError::Validation( errors::ValidationError { context:String::from("amount should be >0")}));
    }

    repository::increase_received_quantity(tx, order_id, product_id, amount).await?;

    Ok(())
}


/// decrements the received quantity of a product on a given order
///
/// Meant to be called from the invoice module, if there's a need to annull 
/// some invoice and its effects
pub async fn decrease_received_quantity(
    tx: &tokio_postgres::Transaction<'_>,
    order_id: i32,
    product_id: i32,
    amount: i32,
) -> Result<(), errors::ServiceError> {
    if amount <= 0 {
        return Err(errors::ServiceError::Validation( errors::ValidationError { context:String::from("amount should be >0")}));
    }

    repository::decrease_received_quantity(tx, order_id, product_id, amount).await?;

    Ok(())
}
