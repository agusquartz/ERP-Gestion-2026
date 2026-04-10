//Direct DB access

use std::collections::BTreeMap;

use tokio_postgres::Row;
use tokio_postgres::types::ToSql;

use crate::modules::client::dto::create::CreateClientDto;
use crate::modules::client::dto::update::PatchClientDto;
use crate::modules::client::model::{Client, ClientAggregate, Phone};
use crate::shared::db_config;



// ─────────────────────────────────────────────────────────────
// BASE QUERY
// LEFT JOIN because a client might not have phones yet
// Generates ONE ROW PER PHONE - rows_to_aggregates collapses them
// ─────────────────────────────────────────────────────────────

const CLIENT_SELECT_BASE: &str = r#"
SELECT
    cl.id                       AS client_id,
    cl.name                     AS client_name,
    cl.surname                  AS client_surname,
    cl.ruc                      AS client_ruc,
    cl.address                  AS client_address,
    cl.email                    AS client_email,
    cl.birth_date               AS client_birth_date,
    cl.credit_limit::float8     AS client_credit_limit,
    cl.curr_credit::float8      AS client_curr_credit, 
    pn.id                       AS phone_id,
    pn.phone_number             AS phone_number,
    pn.is_emergency             AS phone_is_emergency
FROM clients cl
LEFT JOIN clients_phones cp     ON cp.client_id = cl.id  
LEFT JOIN phone_numbers pn      ON pn.id = cp.phone_id   
"#;

// ─────────────────────────────────────────────────────────────
// AGGREGATION — same as rows_to_aggregates in product
//
// The LEFT JOIN generates this in the DB:
//
// | client_id | client_name | phone_id | phone_number |
// |     1     |    John     |    1     |   123456     |  ← same John row
// |     1     |    John     |    2     |   789012     |  ← same John row
// |     2     |    Jane     |   NULL   |    NULL      |  ← no phones
//
// BTreeMap<client_id, ClientAggregate> collapses everything into:
// → ClientAggregate { client: John, phones: [123456, 789012] }
// → ClientAggregate { client: Jane, phones: [] }
// ─────────────────────────────────────────────────────────────

fn rows_to_aggregates(rows: Vec<Row>) -> Vec<ClientAggregate> {
    let mut map: BTreeMap<i32, ClientAggregate> = BTreeMap::new();

    for row in rows {
        let client_id: i32 = row.get("client_id");

        let entry = map.entry(client_id).or_insert_with(|| ClientAggregate {
            client: Client {
                id: client_id,
                name: row.get("client_name"),
                surname: row.get("client_surname"),
                ruc: row.get("client_ruc"),
                address: row.get("client_address"),
                email: row.get("client_email"),
                birth_date: row.get("client_birth_date"),
                curr_credit: row.get("client_curr_credit"),  
                credit_limit: row.get("client_credit_limit"),
            },
            phones: Vec::new(),
        });

        let phone_id: Option<i32> = row.get("phone_id");
        if let Some(pid) = phone_id {
            if !entry.phones.iter().any(|p| p.id == pid) {
                entry.phones.push(Phone {
                    id: pid,  
                    phone_number: row.get("phone_number"),
                    is_emergency: row.get("phone_is_emergency"),
                });
            }
        }
    }

    map.into_values().collect() 
}

// ─────────────────────────────────────────────────────────────
// GET /clients  y  GET /clients?contains=xxx
// ─────────────────────────────────────────────────────────────
pub async fn query_clients(
    contains: Option<&str>,
) -> Result<Vec<ClientAggregate>, db_config::DbError> {
    let conn = db_config::get_client().await?;

    let sql = format!(
        "{} WHERE ($1::text IS NULL OR cl.name ILIKE '%' || $1 || '%' OR cl.surname ILIKE '%' || $1 || '%')
         ORDER BY client_id, phone_id",
        CLIENT_SELECT_BASE
    );

    let rows = conn.query(&sql, &[&contains]).await?;
    Ok(rows_to_aggregates(rows))
}

// ─────────────────────────────────────────────────────────────
// GET /clients/{id}
// ─────────────────────────────────────────────────────────────
pub async fn query_client_by_id(
    id: i32,
) -> Result<Option<ClientAggregate>, db_config::DbError> {
    let conn = db_config::get_client().await?;

    let sql = format!(
        "{} WHERE cl.id = $1 ORDER BY client_id, phone_id",
        CLIENT_SELECT_BASE
    );

    let rows = conn.query(&sql, &[&id]).await?;
    let mut results = rows_to_aggregates(rows);
    Ok(results.pop())
}

// ─────────────────────────────────────────────────────────────
// POST /clients
// Transaction — touches 3 tables: clients, phone_numbers, clients_phones
// ─────────────────────────────────────────────────────────────
pub async fn insert_client(
    dto: &CreateClientDto,
) -> Result<ClientAggregate, db_config::DbError> {
    let conn = db_config::get_client().await?;
    let mut tx = conn.transaction().await?;

    // 1. Inserts the client
    let row = tx.query_one(
        r#"
        INSERT INTO clients (name, surname, ruc, address, email, birth_date, credit_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        "#,
        &[
            &dto.name,
            &dto.surname,
            &dto.ruc,
            &dto.address,
            &dto.email,
            &dto.birth_date,
            &dto.credit_limit,
        ],
    ).await?;

    let new_id: i32 = row.get("id");

    // 2. For each phone: insert into phone_numbers then into the pivot table
    for phone in &dto.phones {
        // 2a. Inserts the number and retrieves its generated id
        let phone_row = tx.query_one(
            "INSERT INTO phone_numbers (phone_number, is_emergency) VALUES ($1, $2) RETURNING id",
            &[&phone.phone_number, &phone.is_emergency],
        ).await?;

        let phone_id: i32 = phone_row.get("id");

        // 2b. Links the phone to the client in the pivot table
        tx.execute(
            "INSERT INTO clients_phones (client_id, phone_id) VALUES ($1, $2)",
            &[&new_id, &phone_id],
        ).await?;
    }

    // 3. Re-query to return the full aggregate
    let sql = format!(
        "{} WHERE cl.id = $1 ORDER BY client_id, phone_id",
        CLIENT_SELECT_BASE
    );
    let rows = tx.query(&sql, &[&new_id]).await?;
    let mut results = rows_to_aggregates(rows);

    tx.commit().await?;
    Ok(results.pop().unwrap())
}

