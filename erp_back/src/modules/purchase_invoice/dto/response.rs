use serde::{Serialize, Deserialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::modules::purchase_invoice::model::PurchaseInvoice;

/// Payment status derived from total vs total_paid
#[derive(Debug, Serialize)]
#[serder(rename_all="snake_case")]
pub enum PaymentStatus {
	Paid,
	PartialPayment,
	PaymentPending,
}

/// Response DTO for a purchase invoice
#[derive(Debug, Clone, Serialize, Deserialize)]
//#[serde(rename_all="camelCase")]
pub struct PurchaseInvoiceResponse {
	pub id: i32,
	pub invoice_nr: String,
	pub purchase_order_id: i32,
	pub created_at: NaiveDate,
	pub sale_condition_id: i32,
	pub total: Decimal,
	pub total_paid: Decimal,
	pub payment_status: PaymentStatus,
}

impl From<PurchaseInvoice> for PurchaseInvoiceResponse {
	
	fn from(m: PurchaseInvoice) -> Self {
		let payment_status = if m.total_paid >= m.total {
			PaymentStatus::Paid
		} else if m.total_paid > Decimal::ZERO {
			PaymentStatus::PartialPayment
		} else {
			PaymentStatus::PaymentPending
		};
		
		Self {
			id: m.id,
			invoice_nr: m.invoice_nr,
			purchase_order_id: m.purchase_order_id,
			created_at: m.created_at,
			sale_condition_id: m.sale_condition_id,
			total: m.total,
			total_paid: m.total_paid,
			payment_status,
		}
	}
}