use chrono::NaiveDate;
//use crate::modules::quote::model::Quote;

#[derive(Debug,Clone)]
pub struct Invoice {
    pub id: u32,
    pub invoice_number: String,
    pub created_at: NaiveDate,
    pub date: NaiveDate,
    pub expiration_date: NaiveDate,
    pub total: f64,
    pub total_paid: f64,
    pub quote_id: Option<u32>,
    pub client_id: u32,
    pub sale_condition_id: u32,
    pub details: Vec<LineItem>,
}

#[derive(Debug,Clone)]
pub struct Client {
    pub id: u32,
    pub name: String,
    pub surname: String,
    pub ruc: String,
}

#[derive(Debug,Clone)]
pub struct SaleCondition {
    pub id: u32,
    pub name: String,
}

#[derive(Debug,Clone)]
pub struct LineItem {
    pub product: LineProduct,
    pub unit_cost: f64,
    pub tax: u8,
    pub quantity: u32,
}

#[derive(Debug,Clone)]
pub struct LineProduct {
    pub id: u32,
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
