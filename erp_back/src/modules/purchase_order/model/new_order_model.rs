use chrono::NaiveDate;

use crate::modules::purchase_order::model::order_model::LineProduct;
#[derive(Debug,Clone)]
pub struct NewPurchaseOrder {
    pub created_at: NaiveDate,
    pub purchase_request_id: i32,
    pub supplier_id: i32,
    pub details: Vec<NewPurchaseOrderLine>,
}

#[derive(Debug,Clone)]
pub struct NewPurchaseOrderLine {
    pub product: LineProduct,
    pub ordered_quantity: i32,
}

