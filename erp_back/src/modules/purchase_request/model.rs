// ============================================================
// MODEL
// ============================================================

use chrono::NaiveDate;

#[derive(Debug)]
pub struct PurchaseRequest {
    pub id: i32,
    pub created_at: NaiveDate,
    pub employee_id: i32,
}

#[derive(Debug)]
pub struct PurchaseRequestEmployee {
    pub id: i32,
    pub name: String,
    pub surname: String,
}

#[derive(Debug)]
pub struct PurchaseRequestProduct {
    pub id: i32,
    pub description: String,
    pub code: String,
}

#[derive(Debug)]
pub struct PurchaseRequestDetail {
    pub id: i32,
    pub purchase_request_id: i32,
    pub product: PurchaseRequestProduct,
    pub quantity: i32,
}

#[derive(Debug)]
pub struct PurchaseRequestWithDetails {
    pub purchase_request: PurchaseRequest,
    pub employee: PurchaseRequestEmployee,
    pub details: Vec<PurchaseRequestDetail>,
}

#[derive(Debug)]
pub struct ProductSearch {
    pub id: i32,
    pub status_id: i32,
    pub status_name: String,
    pub date_sent: Option<NaiveDate>,
    pub date_received: Option<NaiveDate>,
}


pub struct NewPurchaseRequest {
    pub created_at: NaiveDate,
    pub employee_id: i32,
    pub details: Vec<NewPurchaseRequestLine>,
}

pub struct NewPurchaseRequestLine {
    pub product_id: i32,
    pub quantity: i32,
}
