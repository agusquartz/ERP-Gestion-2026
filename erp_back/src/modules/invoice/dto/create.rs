use serde::{Deserialize, Serialize};

#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceDto {
    pub client_id: u32,
    pub invoice_number: String,
    pub date: String,
    pub expiration_date: String,
    pub sale_condition_id: u8,
    pub quote_id: u32,
    pub details: Vec<CreateInvoiceLineItemDto>,
}

#[derive(Debug,Clone,Deserialize,Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceLineItemDto {
    pub product_id: u32,
    pub quantity: u32,
    pub unit_cost: u64,
}
