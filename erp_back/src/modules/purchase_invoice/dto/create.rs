//! Purchase invoice creation DTOs
//!
//! Defines the structures used to receive and deserialize the HTTP request
//! body for purchase invoice creation.
//!
//! # Payload shape (mirrors the frontend JS object)
//! ```json
//! {
//!   "invoiceNumber": "001-002-0019574",
//!   "supplierId": 3,
//!   "orderId": 188,
//!   "saleConditionId": 1,
//!   "items": [
//!     {
//!       "product": {
//!         "productId": 12,
//!         "productCode": "9780201379623",
//!         "productName": "Neumático 185/65 R15"
//!       },
//!       "quantity": 150,
//!       "unitPrice": 45.00,
//!       "subtotal": 6750.00
//!     }
//!   ],
//!   "total": 6750.00
//! }
//! ```
//!
//! # Design
//! - Raw external input — no validation or computation here
//! - Transformed into `NewPurchaseInvoice` via the mapper
//! - `productCode` and `productName` are sent by the frontend but discarded
//!   in the mapper — only `productId` is persisted
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;

/// Root payload for POST /purchases/purchase-invoices.
///
/// # Notes
/// - `timbrado` is fiscal metadata sent by the frontend; not persisted in
///   `purchase_invoices` table (would need its own column if required later)
/// - `supplierId` is redundant — derivable from the order's FK — but the
///   frontend already has it and sends it explicitly
/// - `total` is pre-computed by the frontend; the service should validate it
///   against the sum of item subtotals (not yet implemented)
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseInvoiceDto {
    pub invoice_number: String,
    pub supplier_id: i32,
    pub order_id: i32,
    pub sale_condition_id: i32,
    pub items: Vec<CreateInvoiceItemDto>,
    pub total: Decimal,
}


/// A single line item in the creation payload.
///
/// Uses composition for the nested `product` field, matching the
/// structure the frontend sends.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceItemDto {
    pub product: CreateInvoiceItemProductDto,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub subtotal: Decimal,
}


/// Nested product reference inside a line item.
///
/// The frontend sends the full product snapshot because it already has it
/// from the order detail view. Only `product_id` is used by the backend —
/// `product_code` and `product_name` are discarded in the mapper.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceItemProductDto {
    pub product_id: i32,
    pub product_code: String,
    pub product_name: String,
}