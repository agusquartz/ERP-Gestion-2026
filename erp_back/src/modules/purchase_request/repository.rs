use std::collections::BTreeMap;
use chrono::Local;
use tokio_postgres::Row;


use crate::db_config::{self, DbError};
use crate::modules::purchase_request::{
    model::{
    NewPurchaseRequest,
    NewQuoteAggregate,
    PatchedQuoteAggregate,
    PurchaseRequestAggregate,
    PurchaseRequest,
    QuoteAggregate,
    QuoteDetail,
    RequestItem,
    },
    dto::{
        create::QuoteDetailLine,
        response::PurchaseRequestResponse,
    },
};

use crate::modules::purchase_request::status::{STATUS_CREATED, STATUS_PENDING, STATUS_OK};


const PURCHASE_REQUEST_SELECT_BASE: &str = r#" 
SELECT
pr.id AS request_id,
pr.created_at AS created_at,
e.id AS employee_id,
e.name AS employee_name,
e.surname AS employee_surname,
p.id AS product_id,
p.code AS product_code,
p.description AS product_description,
cat.id AS category_id,
cat.name AS category_name,
prd.quantity AS quantity,
FROM purchase_requests AS pr
INNER JOIN employees AS e ON pr.employee_id = e.id
INNER JOIN purchase_request_detail ON pr.id = prd.purchase_request_id
INNER JOIN products AS p ON prd.product_id = p.id
INNER JOIN categories AS cat ON p.category_id = cat.id
"#;

pub async fn query_requests(contains: Option<&str>) -> Result<Vec<PurchaseRequestAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;
    if let Some(q) = contains {
        let sql = format!("{} WHERE (COALESCE($1, '') = '' OR p.description ILIKE '%' || $1 || '%' OR cat.name ILIKE '%' || $1 || '%') ORDER BY pr.id, prd.id", PURCHASE_REQUEST_SELECT_BASE); 

        let rows = client.query(&sql, &[&q]).await?;
        let aggregates = rows_to_aggregate(rows);
        return Ok(aggregates)
    }
    let sql = PURCHASE_REQUEST_SELECT_BASE.to_string();
    let rows = client.query(&sql, &[]).await?;
    Ok(rows_to_aggregate(rows))
}

/// Transforms a flat list of database rows into purchase request aggregates.
///
/// Responsibilities:
/// - Groups rows by id
/// - Reconstructs hierarchical domain structures from denormalized results
///
/// Algorithm:
/// - Uses a `BTreeMap` keyed by ID
/// - Initializes an aggregate on first encounter
/// - Appends line items for each subsequent row
///
/// Assumptions:
/// - Every row represents a valid line item (guaranteed by INNER JOINs)
/// - No NULL handling is required
///
/// Complexity:
/// - O(n) over number of rows
fn rows_to_aggregate(rows: Vec<Row>) -> Vec<PurchaseRequestAggregate> {
    let mut map: BTreeMap<i32, PurchaseRequestAggregate> = BTreeMap::new();

    for row in rows {
        let request_id: i32 = row.get("purchase_order_id");

        let entry = map.entry(request_id).or_insert_with(|| PurchaseRequestAggregate {
            request: PurchaseRequest {
                id: request_id,
                created_at: row.get("created_at"),
                employee_name: row.get("employee_name"),
            },
            items: Vec::new(),
            quotes: Vec::new(),
        }
        );

        let detail = RequestItem {
            id: 0,                  // Why does RequestItem have its id in a model? Totally
                                    // uncalled for. Unnecessary. Inefficient.
            product_id: row.get("product_id"),
            product_code: row.get("product_code"),
            product_name: row.get("product_name"),
            category: row.get("category_name"),
            quantity: row.get("quantity"),
        };

        //I hate this thing. It is so unclear. However, We're filling the details of the request
        //now
        entry.items.push(detail);
        //And leaving the quotes array empty. If it becomes necessary to pass a list of every
        //request WITH its respective quotes all at once, here's where you would do it.
        //you would have to make an even bigger SQL query though. 
        // let quote = QuoteAggregate { ... bla bla bla
    }
    map.into_values().collect()
}


/// Persists a new purchase request and its associated line items.
///
/// Behavior:
/// - Inserts the purchase request 
/// - Inserts all associated line items
/// - Commits the transaction
/// - Returns a complete domain object
///
/// Guarantees:
/// - Atomic operation (all-or-nothing)
/// - Returned aggregate reflects committed state
///
///
/// Failure modes:
/// - Any database error aborts the transaction
/// - If the inserted request cannot be retrieved after commit,
///   an invariant violation is raised
pub async fn store_new_request(new_request: NewPurchaseRequest) -> Result<PurchaseRequestAggregate, db_config::DbError> {
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

