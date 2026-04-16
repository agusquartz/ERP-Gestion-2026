/// Quote Repository Layer
///
/// Responsibilities:
/// - Execute SQL queries
/// - Build domain aggregates from raw rows
/// - Manage transactions
///
/// IMPORTANT:
/// - NO business logic
/// - ONLY persistence + mapping

use tokio_postgres::Row;
use crate::modules::quote::dto::create::CreateQuoteDto;
use crate::db_config;
use crate::modules::quote::model::*;
use crate::modules::quote::mapper::rows_to_simple_quotes;

/// Create a new quote with details
///
/// Responsibilities:
/// - Start transaction
/// - Insert quote header
/// - Insert quote details
/// - Compute totals (or accept precomputed)
/// - Return full aggregate

pub async fn create_quote(
    dto: CreateQuoteDto,
) -> Result<QuoteWithDetails, crate::db_config::DbError> {

    if dto.details.is_empty() {
        return Err(crate::db_config::DbError::Other("Quote must have details".into()));
    }

    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    // 1. Insert quote
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

    // 2. Insert details + calculate total
    let mut total: f64 = 0.0;

    for d in dto.details {

        let base = d.unit_cost * d.quantity as f64;
        let tax_amount = base * d.tax / 100.0;
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

    // 3. Update total
    tx.execute(
        "UPDATE quotes SET total = $1 WHERE id = $2",
        &[&total, &quote_id],
    ).await?;

    tx.commit().await?;

    // 4. Re-fetch aggregate
    crate::modules::quote::repository::get_quote_by_id(quote_id)
        .await?
        .ok_or_else(|| crate::db_config::DbError::NotFound)
}

/// Base query (joined aggregate)
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
    s.name          AS status_name,

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


pub async fn get_quotes(
    contains: Option<String>,
) -> Result<Vec<QuoteWithDetails>, crate::db_config::DbError> {
    let client = db_config::get_client().await?;

    let mut sql = BASE_QUERY.to_string();
    let mut params: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = Vec::new();
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

/*pub async fn get_quotes(
    contains: Option<String>
) -> Result<Vec<QuoteWithDetails>, crate::db_config::DbError> {

    let client = db_config::get_client().await?;

    let (sql, params): (String, Vec<&(dyn tokio_postgres::types::ToSql + Sync)>) =
        if let Some(q) = contains {
            (
                format!(
                    r#"
                    {BASE_QUERY}
                    WHERE (
                        c.name ILIKE '%' || $1 || '%'
                        OR c.surname ILIKE '%' || $1 || '%'
                        OR c.document ILIKE '%' || $1 || '%'
                        OR q.id::text ILIKE '%' || $1 || '%'
                    )
                    ORDER BY q.id
                    "#
                ),
                vec![q],
            )
        } else {
            (BASE_QUERY.to_string(), vec![])
        };

    let rows = client.query(&sql, &params).await?;
    Ok(rows_to_aggregate(rows))
}*/

/// Get one quote
pub async fn get_quote_by_id(id: i32) -> Result<Option<QuoteWithDetails>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!("{BASE_QUERY} WHERE q.id = $1 ORDER BY q.id, qd.id");

    let rows = client.query(&sql, &[&id]).await?;
    let data = rows_to_aggregate(rows);

    Ok(data.into_iter().next())
}



/// Convert rows → aggregate
fn rows_to_aggregate(rows: Vec<Row>) -> Vec<QuoteWithDetails> {
    use std::collections::BTreeMap;

    let mut map: BTreeMap<i32, QuoteWithDetails> = BTreeMap::new();

    for row in rows {
        let id: i32 = row.get("quote_id");
        
        let quote_client_id: i32 = row.get("quote_client_id");
        let quote_status_id: i32 = row.get("quote_status_id");

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

        let detail_id: Option<i32> = row.get("detail_id");

        if let Some(did) = detail_id {

            let unit_cost: f64 = row.get("unit_cost");
            let tax: f64 = row.get("tax");
            let quantity: i32 = row.get("quantity");

            let base = unit_cost * quantity as f64;
            let tax_amount = base * tax / 100.0;
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
