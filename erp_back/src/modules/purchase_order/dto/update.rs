use serde::{Serialize,Deserialize};

#[derive(Debug,Clone,Serialize,Deserialize,Default)]
#[serde(rename_all = "camelCase")]
struct PatchPurchaseOrderDto {
    order_id: i32,
    status_id: Option<u8>,
    details: Vec<PatchPurchaseOrderLineDto>,
}

#[derive(Debug,Clone,Serialize,Deserialize,Default)]
#[serde(rename_all = "camelCase")]
struct PatchPurchaseOrderLineDto {
    product_id: i32,
    received_quantity: i32,
}

