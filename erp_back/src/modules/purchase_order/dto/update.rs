use serde::{Serialize,Deserialize};

#[derive(Debug,Clone,Serialize,Deserialize,Default)]
#[serde(rename_all = "camelCase")]
pub struct PatchPurchaseOrderDto {
    pub order_id: i32,
    pub status_id: Option<i8>,
    pub details: Vec<PatchPurchaseOrderLineDto>,
}

#[derive(Debug,Clone,Serialize,Deserialize,Default)]
#[serde(rename_all = "camelCase")]
pub struct PatchPurchaseOrderLineDto {
    pub product_id: i32,
    pub received_quantity: i32,
}

