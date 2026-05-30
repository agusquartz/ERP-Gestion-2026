//! Invoice repository layer
//!
//! This module handles all database interactions for invoices.
//! It is responsible for:
//! - Executing SQL queries
//! - Mapping database rows into domain aggregates
//! - Managing transactions for write operations
//!
//! # Responsibilities
//! - Persist invoice data (`NewInvoice` → DB)
//! - Retrieve invoice data (`DB → InvoiceAggregate`)
//! - Handle joins across related tables (clients, sale conditions, products)
//!
//! # Design Principles
//! - No business logic
//! - No HTTP concerns
//! - Pure persistence + mapping
//! - Returns domain aggregates to service layer
use std::collections::BTreeMap;
use tokio_postgres::Row;
use chrono::NaiveDate;

use crate::modules::invoice::model::{self, NewInvoice, InvoiceAggregate};
use crate::shared::db_config;

/// Base SQL query used for retrieving invoices with all related data.
///
/// Includes joins for:
/// - client
/// - sale condition
/// - invoice line items
/// - product data
const INVOICE_SELECT_BASE: &str = r#"
SELECT 
inv.id AS invoice_id,
(
    lpad(inv.establishment::text, 3, '0') || '-' ||
    lpad(inv.emission_point::text, 3, '0') || '-' ||
    lpad(inv.invoice_sequential::text, 7, '0')
) AS invoice_number,
inv.created_at AS created_at,
inv.date AS date,
inv.expiration_date AS expiration_date,
inv.total AS total,
inv.total_paid AS total_paid,
inv.sale_condition_id AS sale_condition_id,
sale.name AS sale_condition_name,
inv.quote_id AS quote_id,
c.id AS client_id,
c.name AS client_name,
c.surname AS client_surname,
c.document AS client_document,
line.id AS detail_id,
line.product_id AS detail_product_id,
p.description AS detail_product_description,
p.code AS detail_product_code,
line.quantity AS detail_quantity,
line.unit_cost AS detail_unit_cost,
line.tax AS detail_tax
FROM sales_invoices AS inv 
JOIN clients AS c ON inv.client_id = c.id 
JOIN sale_conditions AS sale ON inv.sale_condition_id = sale.id 
LEFT JOIN sale_invoice_details AS line ON inv.id = line.invoice_id 
LEFT JOIN products AS p ON line.product_id = p.id 
"#;

/// Retrieves a single invoice by ID.
///
/// # Returns
/// - `Some(InvoiceAggregate)` if found
/// - `None` if no invoice exists
pub async fn query_invoice_by_id(id: i32) -> Result<Option<model::InvoiceAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;


    let sql = format!("{} WHERE inv.id = $1 ORDER BY invoice_id, detail_id", INVOICE_SELECT_BASE);

    let rows = client.query(&sql, &[&id]).await?;

    let invoices = rows_to_aggregate(rows);


    Ok(invoices.into_iter().next())
}

/// Retrieves invoices with optional filtering.
///
/// # Arguments
/// - `contains`: optional search string
pub async fn query_invoices(
    search: Option<String>,
    filter: Option<String>,
    since:  Option<NaiveDate>,
    to:     Option<NaiveDate>,
    status: Option<String>,
    cursor: Option<i32>,
    limit:  i64,
    ) -> Result<Vec<model::InvoiceAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;
    let sql = format!("
            {}
    WHERE inv.id IN (
            SELECT DISTINCT inv2.id
            FROM sales_invoices AS inv2
            LEFT JOIN sale_invoice_details AS line2 ON inv2.id = line2.invoice_id
            LEFT JOIN products AS p2 ON line2.product_id = p2.id
            INNER JOIN clients AS c2 ON inv2.client_id = c2.id
            INNER JOIN sale_conditions AS s2 ON inv2.sale_condition_id = s2.id
            WHERE ($1::INT  IS NULL OR inv2.id                      > $1)
<<<<<<< HEAD
            AND ($3::TEXT IS NULL OR p2.description::TEXT ILIKE '%' || $3 || '%' OR c2.name ILIKE '%' || $3 || '%' OR c2.surname ILIKE '%' || $3 || '%' OR ( lpad(inv.establishment::text, 3, '0') || '-' || lpad(inv.emission_point::text, 3, '0') || '-' || lpad(inv.invoice_sequential::text, 7, '0') ILIKE $3))
=======
            AND ($3::TEXT IS NULL OR p2.description::TEXT ILIKE '%' || $3 || '%' OR c2.name ILIKE '%' || $3 || '%' OR c2.surname ILIKE '%' || $3 || '%')
>>>>>>> 96b3442 (KAN-76: Add cursor and queries to invoices)
            AND ($4::DATE IS NULL OR inv2.created_at             >= $4)
            AND ($5::DATE IS NULL OR inv2.created_at             <= $5)
            ORDER BY inv2.id ASC
            LIMIT $6
            )
    AND($2::TEXT IS NULL OR c.name ILIKE '%' || $2 || '%' OR c.surname ILIKE '%' || $2 || '%')
    ORDER BY inv.id ASC, line.id ASC
            ", INVOICE_SELECT_BASE); 

        let rows = client.query(&sql, &[&cursor, &search, &filter, &since, &to, &limit]).await?;

    Ok(rows_to_aggregate(rows))

}

/// Converts flat SQL rows into structured `InvoiceAggregate`s.
///
/// # Behavior
/// - Groups rows by invoice_id
/// - Reconstructs nested line items
/// - Produces one aggregate per invoice
fn rows_to_aggregate(rows: Vec<Row>) -> Vec<model::InvoiceAggregate> {
    let mut map: BTreeMap<i32, model::InvoiceAggregate> = BTreeMap::new();

    for row in rows {
        let invoice_id: i32 = row.get("invoice_id");

        let client = model::Client {
            id: row.get("client_id"),
            name: row.get("client_name"),
            surname: row.get("client_surname"),
            document: row.get("client_document"),
        };

        let sale_condition = model::SaleCondition {
            id: row.get("sale_condition_id"),
            name: row.get("sale_condition_name"),
        };


        let entry = map.entry(invoice_id).or_insert_with(|| model::InvoiceAggregate {
            invoice: model::Invoice {
                id: invoice_id,
                invoice_number: row.get("invoice_number"),
                created_at: row.get("created_at"),
                date: row.get("date"),
                expiration_date: row.get("expiration_date"),
                total: row.get("total"),
                total_paid: row.get("total_paid"),
                sale_condition_id: row.get("sale_condition_id"),
                client_id: row.get("client_id"),
                quote_id: row.get("quote_id"),
                details: Vec::new(),
            },
            client,
            sale_condition,
        }
        );

        let detail = model::LineItem {
            product: model::LineProduct {
                id: row.get("detail_product_id"),
                description: row.get("detail_product_description"),
                code: row.get("detail_product_code"),
            },
            unit_cost: row.get("detail_unit_cost"),
            quantity: row.get("detail_quantity"),
            tax: row.get("detail_tax"),
        };

        entry.invoice.details.push(detail);


    }
    map.into_values().collect()
}


pub async fn store_new_invoice(
    tx: &tokio_postgres::Transaction<'_>,
    invoice: NewInvoice,
) -> Result<i32, db_config::DbError> {
    let row = match tx.query_one(
    "INSERT INTO sales_invoices 
        (
            client_id,
            date,
            expiration_date,
            total,
            quote_id,
            sale_condition_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id",
        &[
            &invoice.client_id,
            &invoice.date,
            &invoice.expiration_date,
            &invoice.total,
            &invoice.quote_id,
            &invoice.sale_condition_id,
        ],
    ).await {
        Ok(rows) => rows,
        Err(e) => {
            eprintln!("{:?}", e);
            return Err(db_config::DbError::Other("lol".to_string()))
        }
    };
    println!("Insertó el header");

    let invoice_id: i32 = row.get(0);

    for detail in invoice.details {
        tx.execute(
            "INSERT INTO sale_invoice_details 
            (invoice_id, product_id, unit_cost, tax, quantity)
            VALUES ($1, $2, $3, $4, $5)",
            &[
            &invoice_id,
            &detail.product.id,
            &detail.unit_cost,
            &detail.tax,
            &detail.quantity,
            ],
        ).await?;
    }

    Ok(invoice_id)
}
