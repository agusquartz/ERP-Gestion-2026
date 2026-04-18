//! # Client Repository
//!
//! This module is the **only place in the codebase that executes SQL**.
//! All other layers (service, handler) call these functions and work
//! with Rust structs — they never construct or run SQL directly.
//!
//! ## Responsibilities
//! - Execute `SELECT`, `INSERT`, `UPDATE`, `DELETE` queries against PostgreSQL
//! - Aggregate multi-row JOIN results into [`ClientAggregate`] structs
//! - Manage transactions for multi-table writes (create / patch)
//!
//! ## Connection management
//! Connections are obtained via [`crate::shared::db_config::get_client`], which
//! pulls a connection from the shared pool. Each function acquires its own
//! connection; long-lived connections are never held across request boundaries.
//!
//! ## Error handling
//! All functions return `Result<_, db_config::DbError>`, which wraps
//! `tokio_postgres::Error`. The service layer converts this into `ServiceError`
//! via the `From` implementation in `service.rs`.

use std::collections::BTreeMap;

use tokio_postgres::Row;
use tokio_postgres::types::ToSql;

use crate::modules::client::dto::create::CreateClientDto;
use crate::modules::client::dto::update::PatchClientDto;
use crate::modules::client::model::{Client, ClientAggregate, Phone};
use crate::shared::db_config;


// ─────────────────────────────────────────────────────────────────────────────
// BASE QUERY
// ─────────────────────────────────────────────────────────────────────────────
 
/// Shared SELECT fragment used by every read operation in this repository.
///
/// Uses a `LEFT JOIN` (not `INNER JOIN`) so that clients **without phones**
/// are still returned — their phone columns will be `NULL`.
///
/// Column aliases (`client_id`, `phone_id`, etc.) are explicit to:
/// 1. Avoid name collisions between `clients.id` and `phone_numbers.id`
/// 2. Make [`rows_to_aggregates`] column lookups unambiguous via `.get("alias")`
///
/// The query intentionally casts `NUMERIC` fields to `float8` (double precision)
/// to avoid a `tokio_postgres` type mismatch when reading into Rust's `f64`


const CLIENT_SELECT_BASE: &str = r#"
SELECT
    cl.id                       AS client_id,
    cl.name                     AS client_name,
    cl.surname                  AS client_surname,
    cl.document                 AS client_document,
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


// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATION HELPER
// ─────────────────────────────────────────────────────────────────────────────
 
/// Collapses a flat list of JOIN rows into a collection of [`ClientAggregate`]s.
///
/// ## Why this is necessary
/// The `LEFT JOIN` in `CLIENT_SELECT_BASE` produces **one row per phone**.
/// A client with 3 phones appears as 3 rows with identical client columns
/// but different phone columns. A client with no phones appears as 1 row
/// with `NULL` phone columns.
///
/// Raw output example:
/// ```text
/// | client_id | client_name | phone_id | phone_number |
/// |     1     |    Alice    |    1     |   123456     |  ← same client
/// |     1     |    Alice    |    2     |   789012     |  ← same client
/// |     2     |    Bob      |   NULL   |    NULL      |  ← no phones
/// ```
///
/// After aggregation:
/// ```text
/// ClientAggregate { client: Alice, phones: [123456, 789012] }
/// ClientAggregate { client: Bob,   phones: [] }
/// ```
///
/// ## Implementation details
/// - Uses a `BTreeMap<i32, ClientAggregate>` keyed by `client_id` so that
///   rows for the same client are merged into one entry.
/// - `BTreeMap` (ordered) is used instead of `HashMap` to preserve insertion
///   order by `client_id`, keeping the output deterministic.
/// - A duplicate-phone guard (`!entry.phones.iter().any(|p| p.id == pid)`)
///   prevents the same phone from being added twice if the query somehow
///   returns duplicate rows (defensive programming).
/// - At the end, `.into_values().collect()` drops the map keys and returns
///   only the aggregates as a `Vec`.
///
/// # Parameters
/// - `rows`: Raw rows returned by a `tokio_postgres` query.
///
/// # Returns
/// A `Vec<ClientAggregate>` with one entry per unique client, each containing
/// all their associated phones.


fn rows_to_aggregates(rows: Vec<Row>) -> Vec<ClientAggregate> {
    let mut map: BTreeMap<i32, ClientAggregate> = BTreeMap::new();

    for row in rows {
        let client_id: i32 = row.get("client_id");
        
        // `or_insert_with` only constructs the ClientAggregate on the first
        // occurrence of this client_id — subsequent rows reuse the existing entry.

        let entry = map.entry(client_id).or_insert_with(|| ClientAggregate {
            client: Client {
                id: client_id,
                name: row.get("client_name"),
                surname: row.get("client_surname"),
                document: row.get("client_document"),
                address: row.get("client_address"),
                email: row.get("client_email"),
                birth_date: row.get("client_birth_date"),
                current_credit: row.get("client_curr_credit"),  
                credit_limit: row.get("client_credit_limit"),
            },
            phones: Vec::new(),
        });

        
        // `phone_id` is NULL for clients with no phones (LEFT JOIN result).
        // Only push a Phone if the id is Some, and guard against duplicates.

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


// ─────────────────────────────────────────────────────────────────────────────
// GET /clients  and  GET /clients?contains=xxx
// ─────────────────────────────────────────────────────────────────────────────
 
/// Retrieves all clients, with an optional substring filter on `name` or `surname`.
///
/// The filter is applied using `ILIKE` (case-insensitive LIKE) on both columns.
/// A single SQL query handles both the filtered and unfiltered cases by checking
/// `$1::text IS NULL` — when `contains` is `None`, the WHERE condition is always
/// true and all clients are returned.
///
/// # Parameters
/// - `contains`: If `Some("alice")`, returns clients whose name or surname
///   contains "alice" (case-insensitive). If `None`, returns all clients.
///
/// # Returns
/// - `Ok(Vec<ClientAggregate>)`: Zero or more aggregated clients.
/// - `Err(DbError)`: If the query fails (connection error, timeout, etc.).


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


// ─────────────────────────────────────────────────────────────────────────────
// GET /clients/{id}
// ─────────────────────────────────────────────────────────────────────────────

/// Retrieves a single client by their primary key, including all associated phones.
///
/// Returns `None` (not an error) when no client with the given `id` exists,
/// allowing the service layer to translate this into an HTTP 404 response.
///
/// # Parameters
/// - `id`: The client's primary key (`clients.id`).
///
/// # Returns
/// - `Ok(Some(ClientAggregate))`: The client was found.
/// - `Ok(None)`: No client with this `id` exists.
/// - `Err(DbError)`: Query execution failed.
///
/// ## Implementation note
/// `rows_to_aggregates` returns a `Vec`; `.pop()` extracts the single element
/// (or `None` if the vec is empty) without needing an explicit length check.


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


// ─────────────────────────────────────────────────────────────────────────────
// POST /clients
// ─────────────────────────────────────────────────────────────────────────────
 
/// Inserts a new client together with all their phone numbers in a single transaction.
///
/// ## Transaction steps
/// 1. INSERT into `clients` → get the new `id`
/// 2. For each phone in `dto.phones`:
///    a. INSERT into `phone_numbers` → get the new phone `id`
///    b. INSERT into `clients_phones` (pivot) to link client ↔ phone
/// 3. Re-query the full aggregate using `CLIENT_SELECT_BASE` to return the
///    canonical, complete representation of the newly created client.
/// 4. COMMIT — all three tables are updated atomically.
///
/// If any step fails, the entire transaction is rolled back automatically
/// (tokio_postgres drops the transaction on error before commit is reached).
///
/// ## Why re-query instead of building from the DTO?
/// Re-querying guarantees the returned data matches exactly what is stored
/// in the DB (including DB-generated defaults, triggers, or type coercions),
/// rather than reconstructing it from the input DTO which may differ slightly.
///
/// # Parameters
/// - `dto`: The validated create payload from the HTTP request body.
///
/// # Returns
/// - `Ok(ClientAggregate)`: The fully populated aggregate of the new client.
/// - `Err(DbError)`: If any INSERT or the commit fails.


pub async fn insert_client(
    dto: &CreateClientDto,
) -> Result<ClientAggregate, db_config::DbError> {
    let mut conn = db_config::get_client().await?;
    let tx = conn.transaction().await?;

    // Step 1: Insert the client row and retrieve the auto-generated id
    let row = tx.query_one(
        r#"
        INSERT INTO clients (name, surname, document, address, email, birth_date, credit_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7::float8)
        RETURNING id
        "#,
        &[
            &dto.name,
            &dto.surname,
            &dto.document,
            &dto.address,
            &dto.email,
            &dto.birth_date,
            &dto.credit_limit.unwrap_or(0.0),
        ],
    ).await?;

    let new_id: i32 = row.get("id");

    // Step 2: For each phone — insert number, then link to client via pivot table

    for phone in &dto.phones {

        // 2a. Insert the phone number, get its generated id
        let phone_row = tx.query_one(
            "INSERT INTO phone_numbers (phone_number, is_emergency) VALUES ($1, $2) RETURNING id",
            &[&phone.phone_number, &phone.is_emergency],
        ).await?;

        let phone_id: i32 = phone_row.get("id");


        // 2b. Link phone to client in the many-to-many pivot table
        tx.execute(
            "INSERT INTO clients_phones (client_id, phone_id) VALUES ($1, $2)",
            &[&new_id, &phone_id],
        ).await?;
    }

    
    // Step 3: Re-query the full aggregate to return authoritative DB state
    let sql = format!(
        "{} WHERE cl.id = $1 ORDER BY client_id, phone_id",
        CLIENT_SELECT_BASE
    );
    let rows = tx.query(&sql, &[&new_id]).await?;
    let mut results = rows_to_aggregates(rows);


    // Step 4: Commit — makes all inserts permanent
    tx.commit().await?;
    Ok(results.pop().unwrap())
}


// ─────────────────────────────────────────────────────────────────────────────
// PATCH /clients/{id}
// ─────────────────────────────────────────────────────────────────────────────
 
/// Partially updates an existing client and optionally replaces their phones,
/// all within a single transaction.
///
/// ## Transaction steps
/// 1. Check existence — if client does not exist, rollback and return `Ok(None)`.
/// 2. Build a dynamic `SET` clause from only the `Some(...)` fields in `patch`.
///    If no scalar fields are set, the UPDATE is skipped entirely.
/// 3. If `patch.phones` is `Some(...)`:
///    - Delete all existing `clients_phones` links for this client.
///    - Insert new phone rows into `phone_numbers`.
///    - Insert new links into `clients_phones`.
/// 4. Re-query the full aggregate and COMMIT.
///
/// ## Dynamic SQL construction
/// `tokio_postgres` does not support named parameters or optional clauses,
/// so the SET clause is built manually using indexed placeholders (`$1`, `$2`, …).
/// Parameters are collected into `Vec<Box<dyn ToSql + Sync + Send>>` and then
/// borrowed as `Vec<&(dyn ToSql + Sync)>` for the final `execute` call.
/// The client `id` is always appended last as the WHERE clause parameter.
///
/// ## Phone replacement strategy
/// The current strategy is **delete-then-insert** (replace-all):
/// - All pivot links (`clients_phones`) for the client are deleted.
/// - New `phone_numbers` rows are inserted, then linked.
/// - **Orphaned phone_number rows are NOT deleted** (conservative policy:
///   phones may be shared or referenced elsewhere in a future feature).
///
/// # Parameters
/// - `id`: The primary key of the client to update.
/// - `patch`: The partial update payload. Only `Some` fields are applied.
///
/// # Returns
/// - `Ok(Some(ClientAggregate))`: Update succeeded; returns updated state.
/// - `Ok(None)`: No client with this `id` exists.
/// - `Err(DbError)`: Transaction or query failure.


pub async fn patch_client(
    id: i32,
    patch: &PatchClientDto,
) -> Result<Option<ClientAggregate>, db_config::DbError> {
    let mut conn = db_config::get_client().await?;
    let tx = conn.transaction().await?;

    // Step 1: Existence check — avoid running an UPDATE on a non-existent row
    let exists = tx
        .query_opt("SELECT 1 FROM clients WHERE id = $1", &[&id])
        .await?;

    if exists.is_none() {
        tx.rollback().await?;
        return Ok(None);
    }

    // Step 2: Build dynamic SET clause — only include fields present in the patch

    let mut sets: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn ToSql + Sync + Send + 'static>> = Vec::new();
    let mut idx: i32 = 0; // 1-based placeholder index for PostgreSQL ($1, $2, ...)

    if let Some(v) = patch.name.as_ref() {
        idx += 1;
        sets.push(format!("name = ${}", idx));
        params.push(Box::new(v.clone()));
    }
    if let Some(v) = patch.surname.as_ref() {
        idx += 1;
        sets.push(format!("surname = ${}", idx));
        params.push(Box::new(v.clone()));
    }
    if let Some(v) = patch.document.as_ref() {
        idx += 1;
        sets.push(format!("document = ${}", idx));
        params.push(Box::new(v.clone()));
    }
    if let Some(v) = patch.address.as_ref() {
        idx += 1;
        sets.push(format!("address = ${}", idx));
        params.push(Box::new(v.clone()));
    }
    if let Some(v) = patch.email.as_ref() {
        idx += 1;
        sets.push(format!("email = ${}", idx));
        params.push(Box::new(v.clone()));
    }
    if let Some(v) = patch.birth_date {
        idx += 1;
        sets.push(format!("birth_date = ${}", idx));
        params.push(Box::new(v));
    }
    if let Some(v) = patch.credit_limit {
        idx += 1;
        sets.push(format!("credit_limit = ${}", idx));
        params.push(Box::new(v));
    }
    if let Some(v) = patch.current_credit {
        idx += 1;
        sets.push(format!("curr_credit = ${}", idx));
        params.push(Box::new(v));
    }


    // Only execute UPDATE if at least one scalar field was provided
    if !sets.is_empty() {

        idx += 1;   // The last placeholder is always the WHERE id
        let sql = format!("UPDATE clients SET {} WHERE id = ${}", sets.join(", "), idx);
        params.push(Box::new(id));

        // tokio_postgres requires &[&(dyn ToSql + Sync)], not Vec<Box<...>>,
        // so we build a vec of references into the boxed params.
        let mut param_refs: Vec<&(dyn ToSql + Sync)> = Vec::new();
        for p in &params {
            param_refs.push(&**p);
        }

        let stmt = tx.prepare(&sql).await?;
        tx.execute(&stmt, &param_refs).await?;
    }

    
    // Step 3: If phones are present in the patch, replace all existing phone associations
    if let Some(phones) = patch.phones.as_ref() {
        
        // Deletes only the links, NOT orphan phone_numbers (conservative policy)
        tx.execute(
            "DELETE FROM clients_phones WHERE client_id = $1",
            &[&id],
        ).await?;

        for phone in phones {
            
            // Insert a new phone_numbers row for each phone in the patch
            let phone_row = tx.query_one(
                "INSERT INTO phone_numbers (phone_number, is_emergency) VALUES ($1, $2) RETURNING id",
                &[&phone.phone_number, &phone.is_emergency],
            ).await?;

            let phone_id: i32 = phone_row.get("id");

            // Link the new phone to the client
            tx.execute(
                "INSERT INTO clients_phones (client_id, phone_id) VALUES ($1, $2)",
                &[&id, &phone_id],
            ).await?;
        }
    }

    // Step 4: Re-query the updated aggregate and commit the transaction
    let sql = format!(
        "{} WHERE cl.id = $1 ORDER BY client_id, phone_id",
        CLIENT_SELECT_BASE
    );
    let rows = tx.query(&sql, &[&id]).await?;
    let mut results = rows_to_aggregates(rows);

    tx.commit().await?;
    Ok(results.pop())
}
