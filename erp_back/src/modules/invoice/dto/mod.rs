pub mod create;
pub mod update;
pub mod response;

use serde::{ Deserialize, Serialize };

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct InvoiceListQuery {
    pub contains: Option<String>,
}
