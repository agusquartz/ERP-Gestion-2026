use std::collections::BTreeMap;

use rust_decimal::Decimal;
use tokio_postgres::Row;

use crate::modules::return_notes::{ model,
    dto::query};
use crate::shared::db_config;

const RETURN_NOTE_SELECT_BASE: &str = r#"
SELECT
    rn.id AS return_note_id,
    rn.purchase_invoice_id AS purchase_invoice_id,
    rn.motive AS motive,
    rn.created_at AS created_at,
    rn.status_id AS status_id,

    s.id AS supplier_id,
    s.name AS supplier_name,

    st.status AS status_name,

    rnd.id AS detail_id,
    rnd.returned_quantity AS returned_quantity,
    rnd.amount AS amount,

    p.id AS product_id,
    p.code AS product_code,
    p.description AS product_description

FROM return_notes rn
INNER JOIN purchase_invoices pi
    ON pi.id = rn.purchase_invoice_id
INNER JOIN purchase_orders po
    ON po.id = pi.purchase_order_id
INNER JOIN suppliers s
    ON s.id = po.supplier_id
INNER JOIN statuses st
    ON st.id = rn.status_id
INNER JOIN return_note_details rnd
    ON rnd.return_note_id = rn.id
INNER JOIN products p
    ON p.id = rnd.product_id
"#;

fn rows_to_aggregates(rows: Vec<Row>) -> Vec<model::ReturnNoteAggregate> {
    let mut map: BTreeMap<i32, model::ReturnNoteAggregate> = BTreeMap::new();

    for row in rows {
        let return_note_id: i32 = row.get("return_note_id");

        let entry = map.entry(return_note_id).or_insert_with(|| {
            model::ReturnNoteAggregate {
                return_note: model::ReturnNote {
                    id: return_note_id,
                    purchase_invoice_id: row.get("purchase_invoice_id"),
                    motive: row.get("motive"),
                    created_at: row.get("created_at"),
                    status_id: row.get("status_id"),
                },
                supplier: model::ReturnNoteSupplier {
                    id: row.get("supplier_id"),
                    name: row.get("supplier_name"),
                },
                status: model::ReturnNoteStatus {
                    id: row.get("status_id"),
                    name: row.get("status_name"),
                },
                details: Vec::new(),
            }
        });

        let amount: Decimal = row.get("amount");

        let detail = model::ReturnNoteDetailAggregate {
            id: row.get("detail_id"),
            product: model::ReturnNoteProduct {
                id: row.get("product_id"),
                code: row.get("product_code"),
                description: row.get("product_description"),
            },
            returned_quantity: row.get("returned_quantity"),
            amount,
        };

        entry.details.push(detail);
    }

    map.into_values().collect()
}

/**
 * Sirve para listar muchas notas de devolucion 
 * devuelve un returnnoteaggrete
 */
pub async fn query_return_notes(
    query: query::ReturnNoteListQuery 
) -> Result<Vec<model::ReturnNoteAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!(
        "{} 
        WHERE (
            $1::text IS NULL
            OR rn.motive ILIKE '%' || $1 || '%'
            OR rn.id::text ILIKE '%' || $1 || '%'
            OR rn.purchase_invoice_id::text ILIKE '%' || $1 || '%'
            OR st.status ILIKE '%' || $1 || '%'
            OR p.code ILIKE '%' || $1 || '%'
            OR p.description ILIKE '%' || $1 || '%'
            OR s.id::text ILIKE '%' || $1 || '%'
            OR s.name ILIKE '%' || $1 || '%'
        )
        AND ($2::int IS NULL OR rn.status_id = $2)
        AND ($3::date IS NULL OR rn.created_at >= $3)
        AND ($4::date IS NULL OR rn.created_at <= $4)
        AND ($5::int IS NULL OR rn.id > $5)
        ORDER BY rn.id, rnd.id",
        RETURN_NOTE_SELECT_BASE
    );

    let rows = client
        .query(&sql, &[&query.contains, &query.status_id, &query.from_date, &query.to_date,&query.cursor])
        .await?;

    Ok(rows_to_aggregates(rows))
}



pub async fn query_return_note_by_id(
    id: i32,
) -> Result<Option<model::ReturnNoteAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!(
        "{} WHERE rn.id = $1 ORDER BY rn.id, rnd.id",
        RETURN_NOTE_SELECT_BASE
    );

    let rows = client.query(&sql, &[&id]).await?;

    let mut notes = rows_to_aggregates(rows);

    Ok(notes.pop())
}