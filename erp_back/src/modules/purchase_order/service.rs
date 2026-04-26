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
        create::CreatePurchaseOrderDto
    },
    errors
};


pub async fn list_purchase_orders(contains: Option<String>) -> Result<Vec<PurchaseOrderResponse>, errors::ServiceError> {
    let rows= repository::query_orders(contains.as_deref()).await?;
    Ok(rows.into_iter().map(|inv| PurchaseOrderResponse::from(inv)).collect())
}

pub async fn get_purchase_order(id: i32) -> Result<Option<PurchaseOrderResponse>, errors::ServiceError> {
    let order = repository::query_purchase_order_by_id(id).await?;
    Ok(order.map(|inv| PurchaseOrderResponse::from(inv)))
}

pub async fn create_purchase_order(dto: CreatePurchaseOrderDto) -> Result<PurchaseOrderResponse, errors::ServiceError> {
    //check every product exists
    for line in &dto.details {
        let p: ProductResponse = product::service::get_product(line.product_id)
            .await?
            .ok_or(errors::ServiceError::Validation( errors::ValidationError{
                context: format!("missing product {}", line.product_id)
            }))?;
    }

    let mut details: Vec<NewPurchaseOrderLine> = Vec::new();
    //create all LineItems
    for line in dto.details {
        let item = NewPurchaseOrderLine {
            product_id: line.product_id,
            ordered_quantity: line.ordered_quantity,
        };
        //store in details vector
        details.push(item);
    }


    //create purchase order 
    let order = NewPurchaseOrder {
        created_at: dto.created_at,
        purchase_request_id: dto.purchase_request_id,
        supplier_id: dto.supplier_id,
        details: details
    };

    //now just send to repo and let that layer take charge
    let aggregate = repository::store_new_order(order).await?; 
    let response = PurchaseOrderResponse::from(aggregate);
    Ok(response)

}

