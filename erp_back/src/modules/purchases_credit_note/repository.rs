use std::collections::BTreeMap;
use tokio_postgres::Row;

use crate::modules::purchase_credit_note::model::{
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
    s.satmping AS supplier_stamp,
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
pub async fn query_credit_notes(contains: Option<&str>) -> Result<Vec<credit_note_model::CreditNoteAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;
    
    let mut sql = PURCHASES_CREDIT_NOTE_SELECT_BASE.to_string();
    let mut params: Vec<String> = Vec::new();

    if let Some(q) = contains {
        sql.push_str(" WHERE s.name ILIKE '%' || $1 || '%' OR cn.note_number ILIKE '%' || $1 || '%'");
        params.push(q.to_string());
    }
    
    sql.push_str(" ORDER BY cn.id, cnd.id");

    // Dynamic param mapping
    let rows = if params.is_empty() {
        client.query(&sql, &[]).await?
    } else {
        client.query(&sql, &[&params[0]]).await?
    };

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
                supplier_id: row.get("supplier_id"),
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

pub async fn store_new_credit_note(new_cn: new_credit_note_model::NewCreditNote) -> Result<credit_note_model::CreditNoteAggregate, db_config::DbError> {
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    // 1. Insertar Cabecera
    let row = tx.query_one(
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
    ).await?;

    let cn_id: i32 = row.get(0);

    // 2. Insertar Detalles y Descontar Stock
    for detail in new_cn.details {
        // Insertamos en la tabla de detalles
        tx.execute(
            "INSERT INTO return_credit_note_details 
            (return_credit_note_id, product_id, quantity, unit_cost, subtotal)
            VALUES ($1, $2, $3, $4, $5)",
            &[
                &cn_id,
                &detail.product_id,
                &detail.quantity,
                &detail.unit_cost,
                &detail.subtotal,
            ],
        ).await?;

        // DESCUENTO DE STOCK: Restamos la cantidad devuelta al stock actual
        // Añadimos una salvaguarda para evitar stock negativo si el negocio lo requiere
        let affected = tx.execute(
            "UPDATE products 
             SET stock = stock - $1 
             WHERE id = $2 AND stock >= $1", 
            &[&detail.quantity, &detail.product_id],
        ).await?;

        if affected == 0 {
            return Err(db_config::DbError::InvariantViolation(format!(
                "Insufficient stock to return product ID {}", detail.product_id
            )));
        }
    }

    // Si todo salió bien, confirmamos la transacción
    tx.commit().await?;

    // 3. Re-fetch el agregado completo para retornar
    let aggregate = query_credit_note_by_id(cn_id)
        .await?
        .ok_or(db_config::DbError::InvariantViolation("Inserted credit note not found".into()))?;

    Ok(aggregate)
}