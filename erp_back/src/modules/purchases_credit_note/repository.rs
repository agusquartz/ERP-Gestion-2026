use core::error;
use std::collections::BTreeMap;
use tokio_postgres::{Row, Transaction};
use chrono::NaiveDate;
use crate::modules::purchases_credit_note::errors;

use crate::modules::purchases_credit_note::model::{
    credit_note_model,
    new_credit_note_model
};
use crate::db_config;

/// Base SQL query to fetch Credit Notes with related supplier and detail information.
/// Implements INNER JOINs to ensure domain integrity (Credit Notes must have details).
const PURCHASES_CREDIT_NOTE_SELECT_BASE: &str = r#"
SELECT 
    cn.id AS credit_note_id,
    cn.note_number AS note_number,
    cn.return_note_id AS return_note_id,
    rn.purchase_invoice_id AS invoice_id,
    cn.created_at AS created_at,
    cn.total AS total,
    s.id AS supplier_id,
    s.name AS supplier_name,
    s.stamp AS supplier_stamp,
    cnd.unit_cost AS unit_cost,
    cnd.quantity AS quantity,
    cnd.subtotal AS subtotal,
    p.id AS product_id,
    p.code AS product_code,
    p.description AS product_description
FROM return_credit_notes AS cn 
INNER JOIN return_notes AS rn ON cn.return_note_id = rn.id
INNER JOIN purchase_invoices AS pi ON rn.purchase_invoice_id = pi.id
INNER JOIN purchase_orders AS po ON pi.purchase_order_id = po.id
INNER JOIN suppliers AS s ON po.supplier_id = s.id
INNER JOIN return_credit_note_details AS cnd ON cn.id = cnd.return_credit_note_id
INNER JOIN products AS p ON cnd.product_id = p.id
"#;

/// Retrieves a single Credit Note by its ID.
pub async fn query_credit_note_by_id(id: i32) -> Result<Option<credit_note_model::CreditNoteAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!("{} WHERE cn.id = $1 ORDER BY cn.id, cnd.id", PURCHASES_CREDIT_NOTE_SELECT_BASE);
    let rows = client.query(&sql, &[&id]).await?;

    let credit_notes = rows_to_aggregate(rows);
    Ok(credit_notes.into_iter().next())
}

/// Retrieves all credit notes, optionally filtered by supplier name or note number.
pub async fn query_credit_notes(
    search: Option<String>,
    filter: Option<String>,
    since:  Option<NaiveDate>,
    to:     Option<NaiveDate>,
    status: Option<String>,
    cursor: Option<i32>,
    limit:  i64,
    ) -> Result<Vec<credit_note_model::CreditNoteAggregate>, db_config::DbError> {

    println!("Llega hasta repository");
    let client = db_config::get_client().await?;

    let sql = format!("
            {}
	WHERE cn.id IN (
			SELECT DISTINCT cn2.id
			FROM return_credit_notes AS cn2
			INNER JOIN return_credit_note_details AS cnd2 ON cn2.id = cnd2.return_credit_note_id
			INNER JOIN return_notes AS rn2 ON cn2.return_note_id = rn2.id
			INNER JOIN products AS p2 ON cnd2.product_id = p2.id
			INNER JOIN purchase_invoices AS pi2 ON rn2.purchase_invoice_id = pi2.id
			INNER JOIN purchase_orders AS po2 ON pi2.purchase_order_id = po2.id
			INNER JOIN suppliers AS s2 on po2.supplier_id = s2.id
			WHERE ($1::INT  IS NULL OR cn2.id                      > $1)
			AND ($3::TEXT IS NULL OR p2.description::TEXT ILIKE '%' || $3 || '%')
			AND ($4::DATE IS NULL OR cn2.created_at             >= $4)
			AND ($5::DATE IS NULL OR cn2.created_at             <= $5)
			AND ($6::TEXT IS NULL OR pi2.invoice_nr ILIKE $6)
			ORDER BY cn2.id ASC
			LIMIT $7
			)
	AND($2::TEXT IS NULL OR cn.note_number ILIKE '%' || $2 || '%')
	ORDER BY cn.id ASC, cnd.id ASC
            ", PURCHASES_CREDIT_NOTE_SELECT_BASE); 


            let rows = client.query(&sql, &[&cursor, &search, &filter, &since, &to, &status, &limit]).await?; 

    Ok(rows_to_aggregate(rows))
}

/// Aggregates flat database rows into a structured Credit Note Domain Model.
fn rows_to_aggregate(rows: Vec<Row>) -> Vec<credit_note_model::CreditNoteAggregate> {
    let mut map: BTreeMap<i32, credit_note_model::CreditNoteAggregate> = BTreeMap::new();

    for row in rows {
        let cn_id: i32 = row.get("credit_note_id");

        let supplier = credit_note_model::Supplier {
            id: row.get("supplier_id"),
            name: row.get("supplier_name"),
            stamp: row.get("supplier_stamp"),
        };

        let entry = map.entry(cn_id).or_insert_with(|| credit_note_model::CreditNoteAggregate {
            credit_note: credit_note_model::CreditNoteHeader {
                id: cn_id,
                note_number: row.get("note_number"),
                return_note_id: row.get("return_note_id"),
                invoice_id: row.get("invoice_id"),
                created_at: row.get("created_at"),
                total: row.get("total"),
                supplier_id: supplier.id,
                details: Vec::new(),
            },
            supplier,
        });

        let detail = credit_note_model::CreditNoteDetail {
            product: credit_note_model::ProductInfo {
                id: row.get("product_id"),
                code: row.get("product_code"),
                description: row.get("product_description"),
            },
            unit_cost: row.get("unit_cost"),
            quantity: row.get("quantity"),
            subtotal: row.get("subtotal"),
        };

        entry.credit_note.details.push(detail);
    }
    map.into_values().collect()
}

pub async fn store_new_credit_note_tx(
    tx: &Transaction<'_>,
    new_cn: new_credit_note_model::NewCreditNote,
) -> Result<i32, errors::ServiceError> {
    // 1. Insert Header
    let row = tx
        .query_one(
            "INSERT INTO return_credit_notes 
            (note_number, return_note_id, created_at, total)
            VALUES ($1, $2, $3, $4)
            RETURNING id",
            &[
                &new_cn.note_number,
                &new_cn.return_note_id,
                &new_cn.created_at,
                &new_cn.total,
            ],
        )
        .await
        .map_err(db_config::DbError::from)?;

    let return_credit_note_id: i32 = row.get(0);

    // 2. Insert Details and Deduct Stock
    for detail in new_cn.details {
        // Insert item into the details table
        tx.execute(
            "INSERT INTO return_credit_note_details 
            (return_credit_note_id, product_id, quantity, unit_cost, subtotal)
            VALUES ($1, $2, $3, $4, $5)",
            &[
                &return_credit_note_id,
                &detail.product_id,
                &detail.quantity,
                &detail.unit_cost,
                &detail.subtotal,
            ],
        )
        .await
        .map_err(db_config::DbError::from)?;

        // STOCK DEDUCTION:
        // Deduct the returned quantity from the current stock.
        // The WHERE condition prevents negative stock.
        let affected = tx
            .execute(
                "UPDATE products 
                 SET stock = stock - $1 
                 WHERE id = $2 AND stock >= $1",
                &[&detail.quantity, &detail.product_id],
            )
            .await
            .map_err(db_config::DbError::from)?;

        if affected == 0 {
            return Err(errors::ServiceError::InsufficientStock(
                errors::StockError {
                    product_id: detail.product_id,
                },
            ));
        }
    }

    Ok(return_credit_note_id)
}
