//! Purchase invoice mapper
//!
//! Translates the external creation DTO into the internal domain write model.
//! This is the only place that knows how both representations look.
//!
//! # Design
//! The reverse direction (model → response DTO) is handled by `From`
//! implementations in `dto/response.rs`, not here — same pattern as
//! `purchase_order::mapper`.
//!
//! # What gets discarded
//! - `timbrado`: fiscal metadata not stored in `purchase_invoices`
//! - `supplier_id`: derivable from the order FK, not stored on the invoice
//! - `product_code` / `product_name`: presentation data, only `product_id` is persisted
//!
//! # What gets renamed
//! - `invoice_number` → `invoice_nr` (aligned with DB column)
//! - `order_id`       → `purchase_order_id` (aligned with DB column)
//! - `unit_price`     → `unit_cost` (aligned with DB column)
use crate::modules::purchase_invoice::{
    dto::create::CreatePurchaseInvoiceDto,
    model::{NewInvoiceLineItem, NewPurchaseInvoice},
};

/// Converts a creation DTO into the domain write model.
pub fn to_new_invoice(dto: CreatePurchaseInvoiceDto) -> NewPurchaseInvoice {
    let items = dto.items
        .into_iter()
        .map(|item| NewInvoiceLineItem {
            product_id: item.product.product_id,
            unit_cost:  item.unit_price,
            quantity:   item.quantity,
        })
        .collect();
 
    NewPurchaseInvoice {
        invoice_nr:        dto.invoice_number,
        purchase_order_id: dto.order_id,
        sale_condition_id: dto.sale_condition_id,
        total:             dto.total,
        items,
    }
}