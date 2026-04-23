use chrono::NaiveDate;

#[derive(Debug,Clone)]
pub struct PurchaseOrder {
    pub id: i32,
    pub created_at: NaiveDate,
    pub purchase_request_id: i32,
    pub supplier_id: i32,
    pub status: Status,
    pub details: Vec<LineItem>,
}

#[derive(Debug,Clone)]
pub struct Supplier {
    pub id: i32,
    pub name: String,
}

#[derive(Debug,Clone)]
pub struct Status {
    pub id: i32,
    pub name: String,
}

#[derive(Debug,Clone)]
pub struct LineItem {
    pub product: LineProduct,
    pub ordered_quantity: i32,
    pub received_quantity: i32,
}

#[derive(Debug,Clone)]
pub struct LineProduct {
    pub id: i32,
    pub description: String,
    pub code: String,
}

#[derive(Debug,Clone)]
pub struct PurchaseOrderAggregate {
    pub purchase_order: PurchaseOrder,
    pub supplier: Supplier,
}
