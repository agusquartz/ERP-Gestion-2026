use chrono::NaiveDate;
use rust_decimal::Decimal;

/// Represents a purchase invoice row as returned from the database
pub struct PurchaseInvoice {
	pub id: i32,
	pub invoice_nr: String,
	pub purchase_order_id: i32,
	pub supplier_name: String,
	pub created_at: NaiveDate,
	pub sale_condition_id: i32,
	pub total: Decimal,
	pub total_paid: Decimal,
}