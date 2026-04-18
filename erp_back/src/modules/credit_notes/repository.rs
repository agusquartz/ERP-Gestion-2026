use std::collections::BTreeMap;
use tokio_postgres::Row;

use crate::modules::credit_notes::model;
use crate::db_config;
/// Base SQL query used to fetch credit notes with their related data.
///
/// # Includes
/// - Credit note header
/// - Associated invoice reference
/// - Line items
/// - Product projection
///
/// # Notes
/// - Produces a flat result set (one row per line item)
/// - Requires post-processing to reconstruct aggregates
const CREDIT_NOTES_SELECT_BASE: &str = r#"
SELECT
    cn.id AS credit_note_id,
    cn.credit_note_nr AS credit_note_number,
    cn.created_at AS created_at,
    cn.total AS total,
    si.id AS invoice_id,
    si.invoice_nr AS invoice_number,
    cnd.unit_cost AS detail_unit_cost,
    cnd.quantity AS detail_quantity,
    cnd.tax AS detail_tax,
    p.id AS detail_product_id,
    p.code AS detail_product_code,
    p.description AS detail_product_description
FROM credit_notes AS cn
INNER JOIN sales_invoices AS si
    ON cn.sale_invoice_id = si.id
INNER JOIN credit_note_details AS cnd
    ON cn.id = cnd.credit_note_id
INNER JOIN products AS p
    ON cnd.product_id = p.id
"#;

/// Retrieves a single credit note by ID.
///
/// # Returns
/// - `Some(CreditNoteAggregate)` if found
/// - `None` if no matching record exists
pub async fn query_credit_note_by_id(id: i32) -> Result<Option<model::CreditNoteAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;


    let sql = format!("{} WHERE cn.id = $1 ORDER BY cn.id, cnd.id", CREDIT_NOTES_SELECT_BASE);

    let rows = client.query(&sql, &[&id]).await?;

    let notes = rows_to_aggregate(rows);


    Ok(notes.into_iter().next())
}

/// Retrieves credit notes with optional filtering.
///
/// # Arguments
/// - `contains`: optional search string
///
/// # Behavior
/// - Filters by credit note number or product fields
/// - Returns full aggregates
pub async fn query_credit_notes(contains: Option<&str>) -> Result<Vec<model::CreditNoteAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;
    if let Some(q) = contains {
        let sql = format!("{} WHERE (COALESCE($1, '') = '' OR credit_note_number ILIKE '%' || $1 || '%' OR detail_product_description ILIKE '%' || $1 || '%' OR detail_product_code ILIKE '%' || $1 || '%') ORDER BY cn.id, cnd.id", CREDIT_NOTES_SELECT_BASE); 
    
        let rows = client.query(&sql, &[&q]).await?;
        let aggregates = rows_to_aggregate(rows);
        return Ok(aggregates)
    }
    let sql = CREDIT_NOTES_SELECT_BASE.to_string();
    let rows = client.query(&sql, &[]).await?;
    Ok(rows_to_aggregate(rows))
}

/// Converts flat SQL rows into structured `CreditNoteAggregate`s.
///
/// # Behavior
/// - Groups rows by `credit_note_id`
/// - Reconstructs nested line items
/// - Produces one aggregate per credit note
///
/// # Important
/// This function is responsible for transforming relational data
/// into a domain aggregate structure.
fn rows_to_aggregate(rows: Vec<Row>) -> Vec<model::CreditNoteAggregate> {
    let mut map: BTreeMap<i32, model::CreditNoteAggregate> = BTreeMap::new();

    for row in rows {
        let credit_note_id: i32 = row.get("credit_note_id");

        let invoice_ref = model::InvoiceReference {
            id: row.get("invoice_id"),
            invoice_number: row.get("invoice_number"),
        };

        let entry = map.entry(credit_note_id).or_insert_with(|| model::CreditNoteAggregate {
            credit_note: model::CreditNote {
                id: credit_note_id,
                sale_invoice_id: row.get("invoice_id"),
                credit_note_number: row.get("credit_note_number"),
                created_at: row.get("created_at"),
                total: row.get("total"),
                details: Vec::new(), 
            },
            invoice: invoice_ref,
        }
        );

        let detail = model::CreditNoteLineItem {
            product: model::LineProduct {
                id: row.get("detail_product_id"),
                description: row.get("detail_product_description"),
                code: row.get("detail_product_code"),
            },
            unit_cost: row.get("detail_unit_cost"),
            quantity: row.get("detail_quantity"),
            tax: row.get("detail_tax"),
        };

        entry.credit_note.details.push(detail);

    }
    map.into_values().collect()
}

/// Persists a new credit note and its associated line items.
///
/// # Workflow
/// 1. Begin transaction
/// 2. Insert credit note header
/// 3. Insert line items
/// 4. Commit transaction
/// 5. Re-query full aggregate
///
/// # Returns
/// - Fully constructed `CreditNoteAggregate`
///
/// # Errors
/// - Returns `DbError::NotFound` if re-query fails after insertion
pub async fn store_new_credit_note(credit_note: model::NewCreditNote) -> Result<model::CreditNoteAggregate, db_config::DbError> {
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    let row = match  tx.query_one(
        "INSERT INTO credit_notes 
        (credit_note_nr, sale_invoice_id, created_at, total)
        VALUES ($1, $2, $3, $4)
        RETURNING id",
        &[
            &credit_note.credit_note_number,
            &credit_note.sale_invoice_id,
            &credit_note.created_at,
            &credit_note.total,
        ],
    ).await {
        Ok(row) => row,
        Err(e) => {
            println!("Db Error: {:?}", e);
            return Err(e.into());
        }
    };

    let credit_note_id: i32 = row.get(0);
    println!("The credit note id is {credit_note_id}");

    for detail in credit_note.details {
        tx.execute(
            "INSERT INTO credit_note_details 
            (credit_note_id, product_id, unit_cost, tax, quantity)
            VALUES ($1, $2, $3, $4, $5)",
            &[
                &credit_note_id,
                &detail.product.id,
                &detail.unit_cost,
                &detail.tax,
                &detail.quantity,
            ],
        ).await?;
    }
    tx.commit().await?;

    let aggregate = query_credit_note_by_id(credit_note_id)
        .await? 
        .ok_or(db_config::DbError::InvariantViolation(
                "Inserted credit note not found after commit".to_string()));

    aggregate
}
