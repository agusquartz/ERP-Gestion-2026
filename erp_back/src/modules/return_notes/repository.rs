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

    dbg!(&query);

    let sql = format!(
        "{} 
        WHERE rn.id IN (
    SELECT DISTINCT sub_rn.id
    FROM return_notes sub_rn
    INNER JOIN purchase_invoices sub_pi ON sub_pi.id = sub_rn.purchase_invoice_id
    INNER JOIN purchase_orders sub_po ON sub_po.id = sub_pi.purchase_order_id
    INNER JOIN suppliers sub_s ON sub_s.id = sub_po.supplier_id
    INNER JOIN statuses sub_st ON sub_st.id = sub_rn.status_id
    INNER JOIN return_note_details sub_rnd ON sub_rnd.return_note_id = sub_rn.id
    INNER JOIN products sub_p ON sub_p.id = sub_rnd.product_id
    WHERE (
        $1::text IS NULL
        OR sub_rn.motive ILIKE '%' || $1 || '%'
        OR sub_rn.id::text ILIKE '%' || $1 || '%'
        OR sub_rn.purchase_invoice_id::text ILIKE '%' || $1 || '%'
        OR sub_st.status ILIKE '%' || $1 || '%'
        OR sub_p.code ILIKE '%' || $1 || '%'
        OR sub_p.description ILIKE '%' || $1 || '%'
        OR sub_s.id::text ILIKE '%' || $1 || '%'
        OR sub_s.name ILIKE '%' || $1 || '%'
    )
    AND ($2::int IS NULL OR sub_rn.status_id = $2)
    AND ($3::date IS NULL OR sub_rn.created_at >= $3)
    AND ($4::date IS NULL OR sub_rn.created_at <= $4)
    AND ($5::int IS NULL OR sub_rn.id > $5)
    ORDER BY sub_rn.id
    LIMIT $6
)
ORDER BY rn.id, rnd.id;
        ",
        RETURN_NOTE_SELECT_BASE
    );

    let rows = match client
        .query(&sql, &[&query.contains, &query.status_id, &query.from_date, &query.to_date,&query.cursor, &query.limit])
        .await {
            Ok(rows) => rows,
            Err(e) => {
                dbg!(&e);
                return Err(db_config::DbError::Other("Failed to database :(".to_string()))
            },
        };
    Ok(rows_to_aggregates(rows))
}



pub async fn query_return_note_by_id(
    id: i32,
) -> Result<Option<model::ReturnNoteAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;
    println!("Antes de la query");
    let sql = format!(
        "{} WHERE rn.id = $1 ORDER BY rn.id, rnd.id",
        RETURN_NOTE_SELECT_BASE
    );
    println!("Despues de la query");
    let rows = client.query(&sql, &[&id]).await?;

    let mut notes = rows_to_aggregates(rows);

    Ok(notes.pop())
}


pub async fn get_status_id_by_name(
    status_name: &str,
) -> Result<i32, db_config::DbError> {
    let client = db_config::get_client().await?;

    let row = client
        .query_one(
            "SELECT id FROM statuses WHERE  status ILIKE $1",
            &[&status_name],
        )
        .await?;
    

    
    Ok(row.get("id"))
}



pub async fn store_new_return_note(
    new_note: model::NewReturnNote,
) -> Result<model::ReturnNoteAggregate, db_config::DbError> {
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    let row = tx
        .query_one(
            "
            INSERT INTO return_notes
                (purchase_invoice_id, motive, created_at, status_id)
            VALUES
                ($1, $2, $3, $4)
            RETURNING id
            ",
            &[
                &new_note.purchase_invoice_id,
                &new_note.motive,
                &new_note.created_at,
                &new_note.status_id,
            ],
        )
        .await?;

    let return_note_id: i32 = row.get(0);

    for detail in new_note.details {
        tx.execute(
            "
            INSERT INTO return_note_details
                (return_note_id, product_id, returned_quantity, amount)
            VALUES
                ($1, $2, $3, $4)
            ",
            &[
                &return_note_id,
                &detail.product_id,
                &detail.returned_quantity,
                &detail.amount,
            ],
        )
        .await?;
    }

    tx.commit().await?;

    query_return_note_by_id(return_note_id)
        .await?
        .ok_or_else(|| {
            db_config::DbError::InvariantViolation(
                "Inserted return note not found after commit".into(),
            )
        })
}
