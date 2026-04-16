//! # Quote Repository Layer
//!
//! This module is the **only place in the codebase that executes SQL** for the
//! quote domain. All other layers call these functions and work with Rust structs.
//!
//! ## Responsibilities
//! - Execute `SELECT`, `INSERT`, and `UPDATE` queries against PostgreSQL
//! - Manage multi-step transactions for write operations
//! - Assemble raw JOIN rows into [`QuoteWithDetails`] aggregates
//! - Compute derived values (subtotal, total) during write operations
//!
//! ## What this module does NOT do
//! - Apply business rules or validation (that is the service's job)
//! - Serialize or format data for HTTP responses (that is the mapper/DTO's job)
//!
//! ## Connection management
//! Connections are obtained via [`crate::db_config::get_client`], which pulls a
//! connection from the shared pool. Each function acquires its own connection
//! for the duration of the operation.

use tokio_postgres::Row;
use crate::modules::quote::dto::create::CreateQuoteDto;
use crate::db_config;
use crate::modules::quote::model::*;
use crate::modules::quote::mapper::rows_to_simple_quotes;
use rust_decimal::Decimal;

// ─────────────────────────────────────────────────────────────────────────────
// BASE QUERY
// ─────────────────────────────────────────────────────────────────────────────
 
/// Shared SELECT fragment reused by all read operations in this repository.
///
/// ## JOIN strategy
/// - `JOIN clients`       — always present; every quote must have a client (INNER JOIN).
/// - `JOIN statuses`      — always present; every quote must have a status (INNER JOIN).
/// - `LEFT JOIN quote_details` — a quote may have zero details (e.g. draft just created).
/// - `LEFT JOIN products`      — details reference products, but LEFT JOIN guards against
///                               orphaned detail rows if a product is ever deleted.
///
/// ## Column aliasing
/// Explicit aliases (`AS quote_id`, `AS client_name`, etc.) are required because:
/// 1. Multiple tables have an `id` column — without aliases `row.get("id")` is ambiguous.
/// 2. `rows_to_aggregate` uses these aliases to read columns by name via `.get("alias")`.
///
/// ## Numeric casting
/// `NUMERIC` columns (`total`, `unit_cost`, `tax`) are read directly as [`Decimal`]
/// via `tokio_postgres`'s `rust_decimal` feature — no explicit cast needed in SQL.

const BASE_QUERY: &str = r#"
SELECT 
    q.id            AS quote_id,
    q.created_at,
    q.total,
    q.client_id     AS quote_client_id,
    q.status_id     AS quote_status_id,

    c.id            AS client_id,
    c.name          AS client_name,
    c.surname       AS client_surname,
    c.document      AS client_document,

    s.id            AS status_id,
    s.status        AS status_name,

    qd.id           AS detail_id,
    qd.product_id,
    qd.unit_cost,
    qd.tax,
    qd.quantity,

    p.id            AS product_id,
    p.description   AS product_description,
    p.code          AS product_code

    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    JOIN statuses s ON q.status_id = s.id
    LEFT JOIN quote_details qd ON q.id = qd.quote_id
    LEFT JOIN products p ON qd.product_id = p.id
"#;


// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────
 
/// Creates a new quote with all its line items inside a single database transaction.
///
/// ## Transaction steps
/// 1. **Guard**: Reject early if `dto.details` is empty (defensive check — the service
///    layer also validates this before calling the repository).
/// 2. **Insert quote header** with `total = 0` as a placeholder.
/// 3. **Insert each detail line**: compute `subtotal` per line and accumulate into `total`.
/// 4. **Update quote total** with the final accumulated value.
/// 5. **Commit** — all inserts become permanent atomically.
/// 6. **Re-fetch** the full aggregate via [`get_quote_by_id`] to return authoritative
///    DB state (including any DB-generated defaults).
///
/// ## Why `total` starts at 0 and is updated afterward
/// PostgreSQL requires the `total` column to exist at INSERT time. Since the total
/// depends on all detail lines being processed, we insert a placeholder first,
/// accumulate the real value in Rust, then UPDATE in a single subsequent statement.
/// This avoids a second round-trip per detail line.
///
/// ## Why re-fetch instead of constructing from the DTO
/// Re-querying guarantees the returned data exactly matches what is stored in the DB,
/// including any DB-level defaults, triggers, or type coercions that may differ from
/// the input values.
///
/// # Parameters
/// - `dto`: The validated create payload from the HTTP request body.
///
/// # Returns
/// - `Ok(QuoteWithDetails)`: The fully populated aggregate of the created quote.
/// - `Err(DbError::Other(...))`: If `dto.details` is empty (defensive guard).
/// - `Err(DbError::NotFound)`: Should not occur in practice — means the re-fetch
///   after commit returned nothing, indicating a very unexpected DB state.
/// - `Err(DbError)`: Any other transaction or query failure.

pub async fn create_quote(
    dto: CreateQuoteDto,
) -> Result<QuoteWithDetails, crate::db_config::DbError> {

    // Defensive guard: the service also checks this, but we guard here too
    // to ensure the repository is safe to call from any future caller.

    if dto.details.is_empty() {
        return Err(crate::db_config::DbError::Other("Quote must have details".into()));
    }

    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;
    
    // Step 1: Insert the quote header with a placeholder total of 0.
    // `RETURNING id` avoids a separate SELECT to get the generated primary key.

    let row = tx.query_one(
        r#"
        INSERT INTO quotes (client_id, status_id, created_at, total)
        VALUES ($1, $2, $3, 0)
        RETURNING id
        "#,
        &[
            &dto.client_id,
            &dto.status_id,
            &dto.created_at,
        ],
    ).await?;

    let quote_id: i32 = row.get("id");

    // Step 2: Insert each detail line and accumulate the grand total in Rust.
    // Computing the total here (instead of in a DB aggregate query) keeps the
    // logic explicit and avoids a separate SELECT SUM(...) round-trip.

    let mut total = Decimal::ZERO;

    for d in dto.details {
        let base = d.unit_cost * Decimal::from(d.quantity);
        let tax_amount = base * d.tax / Decimal::from(100);
        let subtotal = base + tax_amount;

        total += subtotal;

        tx.execute(
            r#"
            INSERT INTO quote_details
            (quote_id, product_id, unit_cost, tax, quantity)
            VALUES ($1, $2, $3, $4, $5)
            "#,
            &[
                &quote_id,
                &d.product_id,
                &d.unit_cost,
                &d.tax,
                &d.quantity,
            ],
        ).await?;
    }

    // Step 3: Update the quote header with the real computed total.

    tx.execute(
        "UPDATE quotes SET total = $1 WHERE id = $2",
        &[&total, &quote_id],
    ).await?;

    // Step 4: Commit — makes all inserts and the update permanent atomically.

    tx.commit().await?;
   

    // Step 5: Re-fetch the full aggregate using the shared read path to ensure
    // the returned data is exactly what is stored in the DB.

    crate::modules::quote::repository::get_quote_by_id(quote_id)
        .await?
        .ok_or_else(|| crate::db_config::DbError::NotFound)
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — LIST
// ─────────────────────────────────────────────────────────────────────────────

/// Retrieves all quotes, with an optional substring filter.
///
/// When `contains` is `Some(...)`, the WHERE clause filters across four fields:
/// - `client.name` — client's first name
/// - `client.surname` — client's last name
/// - `client.document` — document / national ID
/// - `quote.id` — the quote's numeric ID, cast to text for ILIKE matching
///
/// This allows users to search by typing either a name fragment or a quote number.
///
/// ## Dynamic SQL construction
/// The WHERE clause is appended conditionally to `BASE_QUERY` because
/// `tokio_postgres` does not support optional parameters or conditional clauses
/// in prepared statements. The parameter list is built alongside the SQL string.
///
/// ## Missing ORDER BY when unfiltered
/// When no filter is applied the query runs without `ORDER BY`. This is a known
/// limitation — consider adding a default `ORDER BY q.id DESC` for consistency.
///
/// # Parameters
/// - `contains`: Optional search string. Applied as `ILIKE '%value%'` across
///   client name, surname, document, and quote id.
///
/// # Returns
/// - `Ok(Vec<QuoteWithDetails>)`: All matching quotes (may be empty).
/// - `Err(DbError)`: Query execution failed.


pub async fn get_quotes(
    contains: Option<String>,
) -> Result<Vec<QuoteWithDetails>, crate::db_config::DbError> {
    let client = db_config::get_client().await?;

    let mut sql = BASE_QUERY.to_string();
    let mut params: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = Vec::new();
    
    // `pattern` must be declared outside the `if` block so it lives long enough
    // for `params` to hold a reference to it during `client.query(...)`.

    let mut pattern = String::new();

    if let Some(q) = contains {
        pattern = format!("%{}%", q);

        sql.push_str(
            r#"
            WHERE (
                c.name ILIKE $1
                OR c.surname ILIKE $1
                OR c.document ILIKE $1
                OR q.id::text ILIKE $1
            )
            ORDER BY q.id
            "#,
        );

        params.push(&pattern);
    }

    let rows = client.query(&sql, &params).await?;
    Ok(rows_to_aggregate(rows))
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — SINGLE
// ─────────────────────────────────────────────────────────────────────────────
 
/// Retrieves a single quote by its primary key, including all line items.
///
/// Returns `Ok(None)` (not an error) when no quote with the given `id` exists,
/// allowing the service layer to translate this into an HTTP 404 response cleanly.
///
/// The result is also used internally by [`create_quote`] to re-fetch the
/// newly created quote after the transaction commits.
///
/// # Parameters
/// - `id`: The quote's primary key (`quotes.id`).
///
/// # Returns
/// - `Ok(Some(QuoteWithDetails))`: Quote found with all details populated.
/// - `Ok(None)`: No quote with this `id` exists.
/// - `Err(DbError)`: Query execution failed.

pub async fn get_quote_by_id(id: i32) -> Result<Option<QuoteWithDetails>, db_config::DbError> {
    let client = db_config::get_client().await?;

    // `ORDER BY q.id, qd.id` ensures details are assembled in a stable order
    // so the output is deterministic regardless of storage order.

    let sql = format!("{BASE_QUERY} WHERE q.id = $1 ORDER BY q.id, qd.id");

    let rows = client.query(&sql, &[&id]).await?;
    let data = rows_to_aggregate(rows);

    // `.next()` on the iterator returns the first (and only) element, or None.

    Ok(data.into_iter().next())
}


// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATION HELPER
// ─────────────────────────────────────────────────────────────────────────────
 
/// Collapses a flat list of JOIN rows into a collection of [`QuoteWithDetails`] aggregates.
///
/// ## Why this is necessary
/// `BASE_QUERY` uses `LEFT JOIN quote_details`, producing **one row per detail line**.
/// A quote with 3 line items appears as 3 rows with identical header columns but
/// different detail columns. A quote with no details appears as 1 row with NULL
/// detail columns.
///
/// Raw output example:
/// ```text
/// | quote_id | client_name | detail_id | product_description |
/// |    1     |    Alice    |     1     |      Widget A       |  ← same quote
/// |    1     |    Alice    |     2     |      Widget B       |  ← same quote
/// |    2     |    Bob      |    NULL   |        NULL         |  ← no details
/// ```
///
/// After aggregation:
/// ```text
/// QuoteWithDetails { quote.id: 1, client: Alice, details: [Widget A, Widget B] }
/// QuoteWithDetails { quote.id: 2, client: Bob,   details: [] }
/// ```
///
/// ## Implementation details
/// - `BTreeMap<i32, QuoteWithDetails>` keyed by `quote_id` merges rows for the
///   same quote into one entry. `BTreeMap` preserves insertion order by key,
///   keeping output deterministic.
/// - `or_insert_with` builds the `QuoteWithDetails` only on the first row for
///   each `quote_id`; subsequent rows skip directly to the detail-push logic.
/// - `detail_id` is checked for `NULL` (`Option<i32>`) before pushing a detail,
///   handling quotes that have no line items (LEFT JOIN result).
/// - `subtotal` is recomputed here from `unit_cost`, `quantity`, and `tax`
///   because it is not stored in the DB — this ensures the returned value always
///   matches the stored inputs.
///
/// ## Separate `quote_client_id` / `client_id` aliases
/// `BASE_QUERY` aliases `q.client_id` as `quote_client_id` and `c.id` as `client_id`
/// to disambiguate the FK stored on the quote row from the PK on the clients table.
/// Both are read separately here to populate the correct struct fields.
///
/// # Parameters
/// - `rows`: Raw rows from a `tokio_postgres` query using `BASE_QUERY`.
///
/// # Returns
/// A `Vec<QuoteWithDetails>` with one entry per unique `quote_id`.


fn rows_to_aggregate(rows: Vec<Row>) -> Vec<QuoteWithDetails> {
    use std::collections::BTreeMap;

    let mut map: BTreeMap<i32, QuoteWithDetails> = BTreeMap::new();

    for row in rows {
        let id: i32 = row.get("quote_id");
        
        // FK stored on the quotes row (used to populate Quote struct)

        let quote_client_id: i32 = row.get("quote_client_id");
        let quote_status_id: i32 = row.get("quote_status_id");

        // PK from the joined tables (used to populate snapshot structs)

        let client_id: i32 = row.get("client_id");
        let status_id: i32 = row.get("status_id");

        let entry = map.entry(id).or_insert_with(|| QuoteWithDetails {
            quote: Quote {
                id,
                created_at: row.get("created_at"),
                total: row.get("total"),
                client_id: quote_client_id,
                status_id: quote_status_id,
            },
            client: QuoteClient {
                id: client_id,
                name: row.get("client_name"),
                surname: row.get("client_surname"),
                document: row.get("client_document"),
            },
            status: QuoteStatus {
                id: status_id,
                status: row.get("status_name"),
            },
            details: vec![],
        });

        // `detail_id` is NULL for quotes with no line items (LEFT JOIN result)

        let detail_id: Option<i32> = row.get("detail_id");

        if let Some(did) = detail_id {

            let unit_cost: Decimal = row.get("unit_cost");
            let tax: Decimal = row.get("tax");
            let quantity: i32 = row.get("quantity");

            // Recompute subtotal from stored components — not persisted in DB

            let base = unit_cost *Decimal::from(quantity);
            let tax_amount = base * tax / Decimal::from(100);
            let subtotal = base + tax_amount;

            entry.details.push(QuoteDetail {
                id: did,
                quote_id: id,
                product: QuoteProduct {
                    id: row.get("product_id"),
                    description: row.get("product_description"),
                    code: row.get("product_code"),
                },
                unit_cost,
                tax,
                quantity,
                subtotal,
            });
        }
    }

    map.into_values().collect()
}
