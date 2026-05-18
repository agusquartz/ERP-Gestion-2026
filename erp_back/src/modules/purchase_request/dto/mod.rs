use serde::{Serialize, Deserialize};

pub mod create;
pub mod response;
pub mod update;


#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct PurchaseRequestListQuery {
    pub contains: Option<String>,
}
