use serde::{ Deserialize, Serialize };

pub mod create;
pub mod update;
pub mod response;

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct PurchaseOrderListQuery {
    pub contains: Option<String>,
}
