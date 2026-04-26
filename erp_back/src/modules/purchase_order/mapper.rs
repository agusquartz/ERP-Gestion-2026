
use crate::modules::purchase_order::model::order_model;
use crate::modules::purchase_order::dto::response;

pub fn map_purchase_order(value: order_model::PurchaseOrderAggregate) -> response::PurchaseOrderResponse {
    response::PurchaseOrderResponse {
        id: value.purchase_order.id,
        created_at: value.purchase_order.created_at,
        supplier: response::SupplierResponse {
            id: value.supplier.id,
            name: value.supplier.name,
        },
        status: response::StatusResponse {
            id: value.purchase_order.status.id,
            name: value.purchase_order.status.name,
        },
        details: value.purchase_order
            .details
            .into_iter()
            .map(|line| response::PurchaseOrderLineResponse { 
                ordered_quantity: line.ordered_quantity,
                received_quantity: line.received_quantity,
                product: response::LineProductResponse {
                    id: line.product.id,
                    description: line.product.description,
                    code: line.product.code,
                },
            })
        .collect(),
    }
}

