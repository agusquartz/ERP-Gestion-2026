use std::collections::BTreeMap;
use chrono::Local;
use tokio_postgres::Row;


use crate::db_config::{self, DbError};
use crate::modules::purchase_request::{
    model,
    dto::{
        create::QuoteDetailLine,
        response,
        update,
    },
};

use crate::modules::purchase_request::status::{STATUS_CREATED, STATUS_PENDING, STATUS_OK};

/// Base SELECT statement used to retrieve purchase requests and their detail lines.
///
/// This query intentionally returns a denormalized row set which is later grouped
/// into aggregates by `rows_to_request_aggregate`.
const PURCHASE_REQUEST_SELECT_BASE: &str = r#" 
SELECT
pr.id AS purchase_request_id,
pr.created_at AS created_at,
e.id AS employee_id,
e.name AS employee_name,
e.surname AS employee_surname,
p.id AS product_id,
p.code AS product_code,
p.description AS product_description,
cat.id AS product_category_id,
cat.name AS product_category_name,
prd.quantity AS product_quantity
FROM purchase_requests AS pr
INNER JOIN employees AS e ON pr.employee_id = e.id
INNER JOIN purchase_request_details AS prd ON pr.id = prd.purchase_request_id
INNER JOIN products AS p ON prd.product_id = p.id
INNER JOIN categories AS cat ON p.category_id = cat.id
"#;

/// Base SELECT statement used to retrieve purchase quotes and their detail lines.
///
/// The result set is later grouped into quote aggregates by
/// `rows_to_quotes_aggregate`.
const PURCHASE_QUOTE_SELECT_BASE: &str = r#"
SELECT
pq.id AS purchase_quote_id,
pq.purchase_request_id AS purchase_request_id,
s.id AS supplier_id,
s.name AS supplier_name,
s.stamp AS supplier_stamp,
st.id AS status_id,
st.status AS status_name,
pq.created_at AS created_at,
pq.date_sent AS date_sent,
pq.date_received AS date_received,
pqd.product_id AS product_id,
p.code AS product_code,
p.description AS product_description,
p.category_id AS product_category_id,
cat.name AS product_category_name,
pqd.confirmed_quantity AS confirmed_quantity,
pqd.unit_cost AS unit_cost,
pqd.enabled AS enabled
FROM purchase_quotes AS pq
INNER JOIN suppliers AS s ON pq.supplier_id = s.id
INNER JOIN statuses AS st ON pq.status_id = st.id
INNER JOIN purchase_quotes_details AS pqd ON pqd.purchase_quote_id = pq.id
INNER JOIN products AS p ON pqd.product_id = p.id
INNER JOIN categories AS cat ON p.category_id = cat.id
"#;

/// Retrieves purchase requests with optional product/category filtering.
///
/// When `contains` is provided, the query filters by:
/// - product description
/// - product category name
///
/// Returns fully populated aggregates including associated quotes.
pub async fn query_requests(contains: Option<&str>) -> Result<Vec<model::PurchaseRequestAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;
    let req_aggregates: Vec<model::PurchaseRequestAggregate>;
    if let Some(q) = contains {
        let req_sql = format!("{} WHERE (COALESCE($1, '') = '' OR p.description ILIKE '%' || $1 || '%' OR cat.name ILIKE '%' || $1 || '%') ORDER BY pr.id, prd.id", PURCHASE_REQUEST_SELECT_BASE); 

        let req_rows = client.query(&req_sql, &[&q]).await?;
        req_aggregates = rows_to_request_aggregate(req_rows);
    } else {
        let req_sql = PURCHASE_REQUEST_SELECT_BASE.to_string();
        let req_rows = client.query(&req_sql, &[]).await?; 
        req_aggregates = rows_to_request_aggregate(req_rows);
    }
    let complete_aggs = get_the_quotes( &client,req_aggregates).await?;
    Ok(complete_aggs)
}

/// Retrieves all quotes associated with the provided purchase request aggregates.
///
/// Quotes are fetched in bulk using `ANY($1::int4[])` to avoid issuing
/// one query per request.
///
/// The function mutates the provided aggregates by attaching matching quotes.
pub async fn get_the_quotes(
    client: &deadpool_postgres::Client,
    mut reqs: Vec<model::PurchaseRequestAggregate>
) -> Result<Vec<model::PurchaseRequestAggregate>, db_config::DbError> {
    let ids: Vec<i32> = reqs
        .iter()
        .map(|agg| agg.request.id)
        .collect();
    println!("ids = {}", ids.len());
    let quote_sql = format!("{} WHERE pq.purchase_request_id = ANY($1::int4[])", PURCHASE_QUOTE_SELECT_BASE);
    let quote_rows = client.query(&quote_sql, &[&ids]).await?; 
    println!("quote_rows = {}", quote_rows.len());
    let quote_aggregates = rows_to_quotes_aggregate(quote_rows);

    for quote in quote_aggregates {
        let req_id = quote.purchase_request_id;
        if let Some(req) = reqs
            .iter_mut().find(|req| req.request.id == req_id) {
                req.quotes.push(quote);
        }
    }
    Ok(reqs)
}

/// Converts a denormalized purchase request query result into domain aggregates.
///
/// Multiple SQL rows belonging to the same purchase request are grouped together
/// using a `BTreeMap`.
///
/// Each row contributes one request detail line.
fn rows_to_request_aggregate(rows: Vec<Row>) -> Vec<model::PurchaseRequestAggregate> {
    let mut map: BTreeMap<i32, model::PurchaseRequestAggregate> = BTreeMap::new();

    for row in rows {
        let request_id: i32 = row.get("purchase_request_id");

        let entry = map.entry(request_id).or_insert_with(|| model::PurchaseRequestAggregate {
            request: model::PurchaseRequest {
                id: request_id,
                created_at: row.get("created_at"),
                employee: model::EmployeeSummary {
                    id: row.get("employee_id"),
                    name: row.get("employee_name"),
                    surname: row.get("employee_surname"),
                },
                details: Vec::new(),
            },
            quotes: Vec::new(),
        }
        );

        let detail = model::RequestItem {
            product: model::LineProduct {
                id: row.get("product_id"),
                code: row.get("product_code"),
                description: row.get("product_description"),
                category: model::Category {
                    id: row.get("product_category_id"),
                    name: row.get("product_category_name"),
                },
            },
            quantity: row.get("product_quantity"),
        };

        entry.request.details.push(detail);
    }
    map.into_values().collect()
}

/// Converts a denormalized quote query result into quote aggregates.
///
/// Multiple rows belonging to the same quote are grouped together,
/// where each row contributes one quote detail line.
fn rows_to_quotes_aggregate(rows: Vec<Row>) -> Vec<model::Quote>{
    let mut map: BTreeMap<i32, model::Quote> = BTreeMap::new();
    for row in rows{
        let quote_id = row.get("purchase_quote_id");
        let entry = map.entry(quote_id).or_insert_with(|| model::Quote {
            purchase_request_id: row.get("purchase_request_id"),
            created_at: row.get("created_at"),
            date_sent: row.get("date_sent"),
            date_received: row.get("date_received"),
            id: row.get("purchase_quote_id"),
            supplier: model::SupplierSummary {
                id: row.get("supplier_id"),
                name: row.get("supplier_name"),
                stamp: row.get("supplier_stamp"),
            },
            status: model::Status {
                id: row.get("status_id"),
                name: row.get("status_name"),
            },
            details: Vec::new(),
        });

        let detail = model::QuoteDetail {
            product: model::LineProduct {
                id: row.get("product_id"),
                code: row.get("product_code"),
                description: row.get("product_description"),
                category: model::Category {
                    id: row.get("product_category_id"),
                    name: row.get("product_category_name"),
                }
            },
            confirmed_quantity: row.get("confirmed_quantity"),
            unit_cost: row.get("unit_cost"),
            enabled: row.get("enabled"),
        };
        entry.details.push(detail);
    }
    map.into_values().collect()
}

/// Persists a new purchase request and all associated detail lines.
///
/// The operation is executed inside a database transaction to guarantee
/// atomicity between:
/// - purchase request creation
/// - detail line insertion
///
/// After commit, the newly created aggregate is re-queried and returned.
pub async fn store_new_request(new_request: model::NewPurchaseRequest) -> Result<model::PurchaseRequestAggregate, db_config::DbError> {
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    let row = match  tx.query_one(
        "INSERT INTO purchase_requests 
        (created_at, employee_id)
        VALUES ($1, $2)
        RETURNING id",
        &[
        &new_request.created_at,
        &new_request.employee_id,
        ],
    ).await {
        Ok(row) => row,
        Err(e) => {
            println!("Db Error: {:?}", e);
            return Err(e.into());
        }
    };

    let request_id: i32 = row.get(0);

    for detail in new_request.details {
        tx.execute(
            "INSERT INTO purchase_request_details 
            (purchase_request_id, product_id, quantity)
            VALUES ($1, $2, $3)",
            &[
            &request_id,
            &detail.product_id,
            &detail.quantity,
            ],
        ).await?;
    }
    tx.commit().await?;

    let aggregate = query_purchase_request_by_id(request_id)
        .await? 
        .ok_or(db_config::DbError::InvariantViolation("Inserted invoice not found after commit".into()));
    aggregate
}

pub async fn query_purchase_request_by_id(
    id: i32,
) -> Result<Option<model::PurchaseRequestAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let req_sql = format!("{} WHERE pr.id = $1 ORDER BY pr.id, prd.id",PURCHASE_REQUEST_SELECT_BASE);
    let req_rows = client.query(&req_sql, &[&id]).await?; 

    let req_aggregate = rows_to_request_aggregate(req_rows);

    let complete_aggs = get_the_quotes( &client,req_aggregate).await?;

    Ok(complete_aggs.into_iter().next())
}

/// Persists a new purchase quote and all associated quote detail lines.
///
/// The operation is transactional to ensure that:
/// - the quote header
/// - all quote detail lines
///
/// are either fully persisted or fully rolled back.
///
/// After commit, the updated purchase request aggregate is returned.
pub async fn store_purchase_quote(
    new_quote: model::NewQuote
) -> Result< model::PurchaseRequestAggregate, db_config::DbError> {
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    let row = match  tx.query_one(
        "INSERT INTO purchase_quotes 
        (purchase_request_id, created_at, supplier_id, status_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id",
        &[
        &new_quote.purchase_request_id,
        &new_quote.created_at,
        &new_quote.supplier_id,
        &new_quote.status_id,
        ],
    ).await {
        Ok(row) => row,
        Err(e) => {
            println!("Db Error: {:?}", e);
            return Err(e.into());
        }
    };

    let quote_id: i32 = row.get(0);

    for detail in new_quote.details {
        tx.execute(
            "INSERT INTO purchase_quotes_details 
            (purchase_quote_id, product_id, confirmed_quantity, unit_cost)
            VALUES ($1, $2, $3, $4)",
            &[
            &quote_id,
            &detail.product_id,
            &detail.confirmed_quantity,
            &detail.unit_cost,
            ],
        ).await?;
    }
    tx.commit().await?;
    let aggregate = query_purchase_request_by_id(new_quote.purchase_request_id).await?.expect("Should absolutely not be empty, we just inserted something to it without errors");
    Ok(aggregate)
}

/// Updates the status and lifecycle dates of a purchase quote.
///
/// Date fields are updated conditionally depending on the target status:
///
/// - `STATUS_PENDING` updates `date_sent`
/// - `STATUS_OK` updates `date_received`
/// - other statuses only update `status_id`
///
/// This prevents unrelated lifecycle dates from being overwritten.
///
/// Returns the updated purchase request aggregate after modification.
pub async fn patch_purchase_quote(
    purchase_request_id: i32,
    dto: update::PatchPurchaseQuoteDto
) -> Result<model::PurchaseRequestAggregate, db_config::DbError> {

    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    // Build the UPDATE query based on target status
    // so we never overwrite date fields unnecessarily
    match dto.status_id {
        s if s == STATUS_PENDING => {
            tx.execute(
                    "UPDATE purchase_quotes
                     SET status_id = $1, date_sent = $2
                     WHERE id = $3
                     AND purchase_request_id = $4",
                     &[&dto.status_id, &dto.date_sent, &dto.quote_id, &purchase_request_id],
                )
                .await?
        }
        s if s == STATUS_OK => {
            tx.execute(
                    "UPDATE purchase_quotes
                     SET status_id = $1, date_received = $2
                     WHERE id = $3
                     AND purchase_request_id = $4",
                     &[&dto.status_id, &dto.date_received, &dto.quote_id, &purchase_request_id],
                )
                .await?
        }
        _ => {
            tx.execute(
                    "UPDATE purchase_quotes
                     SET status_id = $1
                     WHERE id = $2
                     AND purchase_request_id = $3",
                     &[&dto.status_id, &dto.quote_id, &purchase_request_id],
                )
                .await?
        }
    };

    if let Some(details) = dto.details {
        let sql = String::from("UPDATE purchase_quotes_details
        SET confirmed_quantity = $1, unit_cost = $2
        WHERE product_id = $3 AND purchase_quote_id = $4 
        ");

        for d in details {
            tx.execute(
                &sql,
                &[&d.confirmed_quantity, &d.unit_cost, &d.product_id, &dto.quote_id]
            ).await?;
        }

    }

    tx.commit().await?;

    let Some(agg) =
        query_purchase_request_by_id(purchase_request_id).await?
    else {
        return Err(DbError::InvariantViolation("Purchase request disappeared after successfull update".to_string()));
    };

    Ok(agg)
}

