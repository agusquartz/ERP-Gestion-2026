use std::collections::BTreeMap;
use tokio_postgres::{Row, Transaction};
use chrono::NaiveDate;

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
    (
        lpad(si.establishment::text, 3, '0') || '-' ||
        lpad(si.emission_point::text, 3, '0') || '-' ||
        lpad(si.invoice_sequential::text, 7, '0')
    ) AS invoice_number,
    
    c.id AS client_id,
    c.name AS client_name,
    c.surname AS client_surname,
    
    cnd.unit_cost AS detail_unit_cost,
    cnd.quantity AS detail_quantity,
    cnd.tax AS detail_tax,
    
    p.id AS detail_product_id,
    p.code AS detail_product_code,
    p.description AS detail_product_description

FROM credit_notes AS cn
INNER JOIN sales_invoices AS si
    ON cn.sale_invoice_id = si.id
INNER JOIN clients AS c
    ON si.client_id = c.id
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
pub async fn query_credit_notes(
    search: Option<String>,
    filter: Option<String>,
    since:  Option<NaiveDate>,
    to:     Option<NaiveDate>,
    status: Option<String>,
    cursor: Option<i32>,
    limit:  i64,
    ) -> Result<Vec<model::CreditNoteAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!("
            {}
	WHERE cn.id IN (
			SELECT DISTINCT cn2.id
			FROM credit_notes AS cn2
			INNER JOIN credit_note_details AS cnd2 ON cn2.id = cnd2.credit_note_id
			INNER JOIN products AS p2 ON cnd2.product_id = p2.id
			INNER JOIN sales_invoices AS si2 ON cn2.sale_invoice_id = si2.id
      INNER JOIN clients AS c2 ON si2.client_id = c2.id
			WHERE ($1::INT  IS NULL OR cn2.id                    > $1)
			AND ($3::TEXT IS NULL OR p2.description::TEXT ILIKE '%' || $3 || '%'
        OR c2.name::TEXT ILIKE                        '%' || $3 || '%' 
        OR c2.surname::TEXT ILIKE                     '%' || $3 || '%')
			AND ($4::DATE IS NULL OR cn2.created_at             >= $4)
			AND ($5::DATE IS NULL OR cn2.created_at             <= $5)
			AND ($6::TEXT IS NULL OR si2.invoice_nr          ILIKE $6)
			ORDER BY cn2.id ASC
			LIMIT $7
			)
	AND($2::TEXT IS NULL OR cn.credit_note_nr     ILIKE '%' || $2 || '%')
	ORDER BY cn.id ASC, cnd.id ASC
            ", CREDIT_NOTES_SELECT_BASE); 


    let rows = client.query(&sql, &[&cursor, &search, &filter, &since, &to, &status, &limit]).await?; 
    
    /*dbg!(&search);
    let rows = match client.query(&sql, &[&cursor, &search, &filter, &since, &to, &status, &limit]).await { 
        Ok(rows) => rows,
        Err(e) => {
            dbg!(&e);
            return Err(db_config::DbError::Other(e.to_string()));
        }
    };
    dbg!(&rows);
    */

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

        let client_ref = model::ClientReference {
            id: row.get("client_id"),
            name: row.get("client_name"),
            surname: row.get("client_surname"),
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
            client: client_ref,
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

/// Persists a new credit note and its associated line items using an existing transaction.
///
/// # Workflow
/// 1. Insert credit note header
/// 2. Insert line items
/// 3. Return inserted credit note ID
///
/// # Important
/// This function does not commit or rollback.
/// The transaction is managed by the service layer.
pub async fn store_new_credit_note(
    tx: &Transaction<'_>,
    credit_note: model::NewCreditNote,
) -> Result<i32, db_config::DbError> {
    let row = tx
        .query_one(
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
        )
        .await?;

    let credit_note_id: i32 = row.get(0);

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
        )
        .await?;
    }

    Ok(credit_note_id)
}
