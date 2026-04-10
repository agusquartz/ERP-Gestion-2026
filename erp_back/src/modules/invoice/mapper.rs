use crate::modules::invoice::model;
use crate::modules::invoice::dto::response;

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

