use serde::{Serialize,Deserialize};
use chrono::NaiveDate;

use crate::modules::invoice::model;

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientResponse {
    pub id: u32,
    pub name: String,
    pub surname: String,
    pub ruc: String,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleConditionResponse {
    pub id: u32,
    pub name: String,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineItemResponse {
    pub product: LineProductResponse,
    pub unit_cost: f64,
    pub tax: u8,
    pub quantity: u32,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineProductResponse {
    pub id: u32,
    pub description: String,
    pub code: String,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceResponse {
    pub id: u32,
    pub invoice_number: String,
    pub created_at: NaiveDate,
    pub date: NaiveDate,
    pub expiration_date: NaiveDate,
    pub total: f64,
    pub total_paid: f64,
    pub client: ClientResponse,
    pub sale_condition: SaleConditionResponse,
    pub details: Vec<LineItemResponse>,
}

impl From<model::InvoiceAggregate> for InvoiceResponse {
    fn from(value: model::InvoiceAggregate) -> Self {
        Self {
            id: value.invoice.id,
            invoice_number: value.invoice.invoice_number,
            created_at: value.invoice.created_at,
            date: value.invoice.date,
            expiration_date: value.invoice.expiration_date,
            total: value.invoice.total,
            total_paid: value.invoice.total_paid,
            client: ClientResponse {
                id: value.client.id,
                name: value.client.name,
                surname: value.client.surname,
                ruc: value.client.ruc,
            },
            sale_condition: SaleConditionResponse {
                id: value.sale_condition.id,
                name: value.sale_condition.name,
            },
            details: value.invoice
                .details
                .into_iter()
                .map(|line| LineItemResponse { 
                    unit_cost: line.unit_cost,
                    tax: line.tax,
                    quantity: line.quantity,
                    product: LineProductResponse {
                        id: line.product.id,
                        description: line.product.description,
                        code: line.product.code,
                    },
                })
            .collect(),
        }
    }
}

                

        }
    }
}
