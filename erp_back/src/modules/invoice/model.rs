use chrono::NaiveDate;
use rust_decimal::Decimal;
//use crate::modules::quote::model::Quote;

#[derive(Debug,Clone)]
pub struct Invoice {
    pub id: i32,
    pub invoice_number: String,
    pub created_at: NaiveDate,
    pub date: NaiveDate,
    pub expiration_date: NaiveDate,
    pub total: Decimal,
    pub total_paid: Decimal,
    pub quote_id: Option<i32>,
    pub client_id: i32,
    pub sale_condition_id: i32,
    pub details: Vec<LineItem>,
}

#[derive(Debug,Clone)]
pub struct Client {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub document: String,
}

#[derive(Debug,Clone)]
pub struct SaleCondition {
    pub id: i32,
    pub name: String,
}

#[derive(Debug,Clone)]
pub struct LineItem {
    pub product: LineProduct,
    pub unit_cost: Decimal,
    pub tax: Decimal,
    pub quantity: i32,
}

#[derive(Debug,Clone)]
pub struct LineProduct {
    pub id: i32,
    pub description: String,
    pub code: String,
}

#[derive(Debug,Clone)]
pub struct InvoiceAggregate {
    pub invoice: Invoice,
    pub client: Client,
    pub sale_condition: SaleCondition,
 //   pub quote: Option<Quote>,
}
