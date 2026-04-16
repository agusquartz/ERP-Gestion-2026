use serde::{Serialize,Deserialize};
use crate::modules::invoice::dto::create::CreateInvoiceLineItemDto;

#[derive(Debug,Clone,Serialize,Deserialize,Default)]
#[serde(rename_all = "camelCase")]
struct PatchInvoiceDto {
    client_id: Option<u32>,
    invoice_number: Option<String>,
    date: Option<String>,
    expiration_date: Option<String>,
    sale_condition_id: Option<u8>,
    quote_id: Option<u32>,
    // If you want to patch the details, you have to recreate them whole
    details: Option<Vec<CreateInvoiceLineItemDto>>,
}

impl PatchInvoiceDto {
    pub fn is_empty(&self) -> bool {
        self.client_id.is_none()
            && self.invoice_number.is_none()
            && self.date.is_none()
            && self.expiration_date.is_none()
            && self.sale_condition_id.is_none()
            && self.quote_id.is_none()
            && self.details.is_none()
    }
}
