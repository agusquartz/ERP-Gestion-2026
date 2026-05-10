use serde::Serialize;
use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::modules::purchase_invoice::model::PurchaseInvoice;

/// Payment status derived from total vs total_paid
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all="snake_case")]
pub enum PaymentStatus {
	Paid,
	PartialPayment,
	PaymentPending,
}

impl PaymentStatus {
	pub fn from_totals(total: Decimal, total_paid: Decimal) -> Self{
		if total_paid >= total {
			PaymentStatus::Paid
		} else if total_paid > Decimal::ZERO {
			PaymentStatus::PartialPayment
		} else {
			PaymentStatus::PaymentPending
		}
	}

	pub fn from_str(s: &str) -> Option<Self> {
		match s {
			"paid" 			=> Some(PaymentStatus::Paid),
			"partial_payment" 		=> Some(PaymentStatus::PartialPayment),
			"payment_pending"	=> Some(PaymentStatus::PaymentPending),
			_ 					=> None,
		}
	}
}

/// Response DTO for a purchase invoice
#[derive(Debug, Serialize)]
//#[serde(rename_all="camelCase")]
pub struct PurchaseInvoiceResponse {
	pub id: i32,
	pub invoice_nr: String,
	pub purchase_order_id: i32,
	pub supplier_name: String,
	pub created_at: NaiveDate,
	pub sale_condition_id: i32,
	pub total: Decimal,
	pub total_paid: Decimal,
	pub payment_status: PaymentStatus,
}

impl From<PurchaseInvoice> for PurchaseInvoiceResponse {
	
	fn from(m: PurchaseInvoice) -> Self {
		
		let payment_status = PaymentStatus::from_totals(m.total, m.total_paid);

		Self {
			id: m.id,
			invoice_nr: m.invoice_nr,
			purchase_order_id: m.purchase_order_id,
			supplier_name: m.supplier_name,
			created_at: m.created_at,
			sale_condition_id: m.sale_condition_id,
			total: m.total,
			total_paid: m.total_paid,
			payment_status,
		}
	}
}