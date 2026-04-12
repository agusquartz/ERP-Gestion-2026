//! Invoice mapping utilities
//!
//! This module is responsible for transforming domain models into
//! API response DTOs.
//!
//! It acts as a boundary layer between:
//! - internal domain structures (`model::*`)
//! - external representations (`dto::response::*`)
//!
//! # Design Principles
//! - No business logic
//! - Pure data transformation
//! - One-way mapping (domain → response)
//! - Keeps DTOs decoupled from domain models

use crate::modules::invoice::model;
use crate::modules::invoice::dto::response;

/// Maps an `InvoiceAggregate` into an `InvoiceResponse`.
///
/// # Responsibilities
/// - Flattens aggregate structure into API-friendly format
/// - Converts nested domain models into response DTOs
/// - Transforms naming differences (e.g., `document` → `ruc`)
/// - Maps line items and embedded product projections
///
/// # Notes
/// - Consumes the aggregate (`value`) to avoid unnecessary cloning
/// - Assumes all domain data is already validated and consistent
/// - Does not perform any computation or validation
pub fn map_invoice(value: model::InvoiceAggregate) -> response::InvoiceResponse {
    response::InvoiceResponse {
        id: value.invoice.id,
        invoice_number: value.invoice.invoice_number,
        created_at: value.invoice.created_at,
        date: value.invoice.date,
        expiration_date: value.invoice.expiration_date,
        total: value.invoice.total,
        total_paid: value.invoice.total_paid,
        client: response::ClientResponse {
            id: value.client.id,
            name: value.client.name,
            surname: value.client.surname,
            ruc: value.client.document,
        },
        sale_condition: response::SaleConditionResponse {
            id: value.sale_condition.id,
            name: value.sale_condition.name,
        },
        quote_id: value.invoice.quote_id,
        details: value.invoice
            .details
            .into_iter()
            .map(|line| response::LineItemResponse { 
                unit_cost: line.unit_cost,
                tax: line.tax,
                quantity: line.quantity,
                product: response::LineProductResponse {
                    id: line.product.id,
                    description: line.product.description,
                    code: line.product.code,
                },
            })
        .collect(),
    }
}

