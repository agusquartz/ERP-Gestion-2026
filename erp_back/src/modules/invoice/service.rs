use crate::modules::product;
use crate::modules::product::dto::ProductResponse;
use crate::modules::invoice::repository;
use crate::modules::invoice::model::{NewInvoice, LineProduct, LineItem};
use crate::modules::invoice::dto::response::InvoiceResponse;
use crate::modules::invoice::dto::create::{CreateInvoiceDto, CreateInvoiceLineItemDto};
use crate::shared::db_config;

use std::collections::HashMap;
use rust_decimal::{ Decimal,
                    prelude::FromPrimitive};

#[derive(Debug)]
pub enum ServiceError {
    Db(db_config::DbError),
    Product(product::service::ServiceError),
    Validation(String),
}

impl From<product::service::ServiceError> for ServiceError {
    fn from(err: product::service::ServiceError) -> Self {
        Self::Product(err)
    }
}

/// Converts a database error into a service error.
impl From<db_config::DbError> for ServiceError {
    fn from(value: db_config::DbError) -> Self {
        Self::Db(value)
    }
}

/// Formats the error for user-facing messages or logs.
impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::Db(_) => write!(f, "database error"),
            ServiceError::Validation(msg) => write!(f, "validation error: {msg}"),
            ServiceError::Product(product::service::ServiceError::Db(value)) => write!(f, "error getting product from the database: {value}"),
            ServiceError::Product(product::service::ServiceError::Validation(msg)) => write!(f, "error in product validation: {msg}"),
        }
    }
}

impl std::error::Error for ServiceError {}


pub async fn list_invoices(contains: Option<String>) -> Result<Vec<InvoiceResponse>, ServiceError> {
    let rows= repository::query_invoices(contains.as_deref()).await?;
    Ok(rows.into_iter().map(|inv| InvoiceResponse::from(inv)).collect())
}

pub async fn get_invoice(id: i32) -> Result<Option<InvoiceResponse>, ServiceError> {
    let invoice = repository::query_invoice_by_id(id).await?;
    Ok(invoice.map(|inv| InvoiceResponse::from(inv)))
}

pub async fn create_invoice(dto: CreateInvoiceDto) -> Result<InvoiceResponse, ServiceError> {
    //make a map with products
    let mut products: HashMap<i32,ProductResponse> = HashMap::new();

    for line in &dto.details {
        //Bring product from db
        let p: ProductResponse = product::service::get_product(line.product_id)
            .await?
            .ok_or(ServiceError::Validation(
                    format!("missing product {}", line.product_id)))?;
        //insert to map
        products.insert(p.id, p);
    }

    let mut details: Vec<LineItem> = Vec::new();
    //create all LineItems
    for line in dto.details {

        let product = products
            .get(&line.product_id)
            .expect("already validated above");

        let tax = product
            .taxes
            .first()
            .expect("products should always have tax")
            .percentage;

        let item = LineItem {
            product: LineProduct {
                id: product.id,
                code: product.code.clone(),
                description: product.description.clone(),
            },
            unit_cost: line.unit_cost,
            tax: Decimal::from_f64(tax).ok_or(ServiceError::Validation("invalid float".to_string()))?,
            quantity: line.quantity
        };
        //store in details vector
        details.push(item);
    }

    //compute total amount 
    let total = compute_invoice_total(&details);

    //create invoice proper
    let invoice = NewInvoice {
        invoice_number: dto.invoice_number,
        date: dto.date,
        expiration_date: dto.expiration_date,
        total: total,
        quote_id: dto.quote_id,
        client_id: dto.client_id,
        sale_condition_id: dto.sale_condition_id,
        details: details
    };

    //now just send to repo and let that layer take charge
    let aggregate = repository::store_new_invoice(invoice).await?; 
    println!("Do you think... Ah who am i kidding? Of course's the database!");
    let response = InvoiceResponse::from(aggregate);
    Ok(response)

}

fn compute_invoice_total(details: &Vec<LineItem>) -> rust_decimal::Decimal {
    let mut acc: Decimal = Decimal::from(0);

    for line in details {
        let subtotal = line.unit_cost * Decimal::from(line.quantity);
        let tax_amount = subtotal * line.tax / Decimal::from(100);
        acc = acc + subtotal + tax_amount;
    }

    acc
}
