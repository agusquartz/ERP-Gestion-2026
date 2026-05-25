use std::collections::BTreeMap;
use tokio_postgres::Row;
use chrono::NaiveDate;

use crate::modules::purchase_order::{
    dto::{
        PurchaseOrderListQuery,
        update,
    },
    model::{
        new_order_model, 
        order_model
    }
};

use crate::db_config;

/// Base SQL query used to fetch purchase orders with all required joins.
///
/// This query enforces the domain invariant that a purchase order must
/// have at least one detail:
/// - All joins are `INNER JOIN`, meaning orders without details will not be returned
///
/// Joined tables:
/// - `purchase_orders` (header)
/// - `suppliers`
/// - `statuses`
/// - `purchase_order_details` (line items)
/// - `products`
///
/// Design implications:
/// - Guarantees that every returned row contains a valid line item
/// - Eliminates the need for NULL handling in aggregation logic
/// - Aligns database behavior with domain rule: "orders always have details"
const PURCHASE_ORDER_SELECT_BASE: &str = r#"
SELECT 
po.id AS purchase_order_id,
po.purchase_request_id AS purchase_request_id,
po.created_at AS created_at,
s.id AS supplier_id,
s.name AS supplier_name,
s.stamp AS supplier_stamp,
st.id AS status_id,
st.status AS status_name,
p.id AS product_id,
p.description AS product_description,
p.code AS product_code,
pod.ordered_quantity AS ordered_quantity,
pod.received_quantity AS received_quantity
FROM purchase_orders AS po
INNER JOIN suppliers AS s ON po.supplier_id = s.id
INNER JOIN statuses AS st ON po.status_id = st.id
INNER JOIN purchase_order_details AS pod ON pod.purchase_order_id = po.id
INNER JOIN products AS p ON pod.product_id = p.id
"#;

/// Retrieves a single purchase order aggregate by its identifier.
///
/// Returns:
/// - `Ok(Some(...))` if the order exists
/// - `Ok(None)` if no matching order exists
///
/// Behavior:
/// - Executes a joined query and reconstructs the aggregate via `rows_to_aggregate`
/// - Due to INNER JOINs, only orders with at least one detail are returned
///
/// Invariant:
/// - If an order exists in the database, it must have at least one detail
///   for this function to return it
pub async fn query_purchase_order_by_id(id: i32) -> Result<Option<order_model::PurchaseOrderAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;


    let sql = format!("{} WHERE po.id = $1 ORDER BY po.id, pod.id", PURCHASE_ORDER_SELECT_BASE);

    let rows = client.query(&sql, &[&id]).await?;

    let orders = rows_to_aggregate(rows);


    Ok(orders.into_iter().next())
}

/// Retrieves multiple purchase orders, optionally filtered by a search term.
///
/// Parameters:
/// - `contains`: optional substring used to filter results
///
/// Behavior:
/// - If provided, filters by supplier name, status, or creation date
/// - Otherwise returns all purchase orders
///
/// Notes:
/// - Results are ordered to support correct aggregation
pub async fn query_orders(
    search: Option<String>,
    filter: Option<String>,
    since:  Option<NaiveDate>,
    to:     Option<NaiveDate>,
    status: Option<String>,
    cursor: Option<i32>,
    limit:  i64,
) -> Result<Vec<order_model::PurchaseOrderAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;
    let sql = format!("
            {}
            WHERE po.id IN (
                SELECT po2.id
                FROM purchase_orders AS po2
                INNER JOIN statuses AS st ON po2.status_id = st.id
                WHERE ($1::INT  IS NULL OR po2.id                      > $1)
                  AND ($3::TEXT IS NULL OR po2.purchase_request_id::TEXT = $3)
                  AND ($4::DATE IS NULL OR po2.created_at             >= $4)
                  AND ($5::DATE IS NULL OR po2.created_at             <= $5)
                  AND ($6::TEXT IS NULL OR st.status = $6)
                ORDER BY po2.id ASC
                LIMIT $7
            )
            AND($2::TEXT IS NULL OR s.name ILIKE '%' || $2 || '%')
            ORDER BY po.id ASC, pod.id ASC
            ", PURCHASE_ORDER_SELECT_BASE); 


    let rows = client.query(&sql, &[&cursor, &search, &filter, &since, &to, &status, &limit]).await?;

    Ok(rows_to_aggregate(rows))
}

/// Transforms a flat list of database rows into purchase order aggregates.
///
/// Responsibilities:
/// - Groups rows by `purchase_order_id`
/// - Reconstructs hierarchical domain structures from denormalized results
///
/// Algorithm:
/// - Uses a `BTreeMap` keyed by order ID
/// - Initializes an aggregate on first encounter
/// - Appends line items for each subsequent row
///
/// Assumptions:
/// - Every row represents a valid line item (guaranteed by INNER JOINs)
/// - No NULL handling is required
///
/// Complexity:
/// - O(n) over number of rows
fn rows_to_aggregate(rows: Vec<Row>) -> Vec<order_model::PurchaseOrderAggregate> {
    let mut map: BTreeMap<i32, order_model::PurchaseOrderAggregate> = BTreeMap::new();

    for row in rows {
        let order_id: i32 = row.get("purchase_order_id");

        let supplier = order_model::Supplier {
            id: row.get("supplier_id"),
            name: row.get("supplier_name"),
            stamp: row.get("supplier_stamp"),
        };

        let status = order_model::Status {
            id: row.get("status_id"),
            name: row.get("status_name"),
        };


        let entry = map.entry(order_id).or_insert_with(|| order_model::PurchaseOrderAggregate {
            purchase_order: order_model::PurchaseOrder {
                id: order_id,
                purchase_request_id: row.get("purchase_request_id"),
                created_at: row.get("created_at"),
                supplier_id: row.get("supplier_id"),
                status: status,
                details: Vec::new(),
            },
            supplier,
        }
        );

        let detail = order_model::LineItem {
            product: order_model::LineProduct {
                id: row.get("product_id"),
                description: row.get("product_description"),
                code: row.get("product_code"),
            },
            ordered_quantity: row.get("ordered_quantity"),
            received_quantity: row.get("received_quantity"),
        };

        entry.purchase_order.details.push(detail);
    }
    map.into_values().collect()
}

/// Persists a new purchase order and its associated line items.
///
/// Behavior:
/// - Inserts the purchase order with a default "pending" status
/// - Inserts all associated line items
/// - Commits the transaction
/// - Re-fetches the aggregate to return a complete domain object
///
/// Guarantees:
/// - Atomic operation (all-or-nothing)
/// - Returned aggregate reflects committed state
///
/// Invariants:
/// - A purchase order must have at least one detail
/// - `PENDING_STATUS` must be a valid status ID
///
/// Failure modes:
/// - Any database error aborts the transaction
/// - If the inserted order cannot be retrieved after commit,
///   an invariant violation is raised
pub async fn store_new_order(new_order: new_order_model::NewPurchaseOrder) -> Result<order_model::PurchaseOrderAggregate, db_config::DbError> {
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    const PENDING_STATUS: i32 = 3; //Hardcoded because a new order will always start as a pending
                                   //order
    let row = match  tx.query_one(
        "INSERT INTO purchase_orders 
        (purchase_request_id, created_at, supplier_id, status_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id",
        &[
        &new_order.purchase_request_id,
        &new_order.created_at,
        &new_order.supplier_id,
        &PENDING_STATUS
        ],
    ).await {
        Ok(row) => row,
        Err(e) => {
            println!("Db Error: {:?}", e);
            return Err(e.into());
        }
    };

    let order_id: i32 = row.get(0);

    for detail in new_order.details {
        tx.execute(
            "INSERT INTO purchase_order_details 
            (purchase_order_id, product_id, ordered_quantity)
            VALUES ($1, $2, $3)",
            &[
            &order_id,
            &detail.product_id,
            &detail.ordered_quantity,
            ],
        ).await?;
    }
    tx.commit().await?;

    let aggregate = query_purchase_order_by_id(order_id)
        .await? 
        .ok_or(db_config::DbError::InvariantViolation("Inserted invoice not found after commit".into()));
    aggregate
}

/// Applies a partial update to a purchase order.
///
/// Behavior:
/// - Verifies purchase order existence
/// - Updates received quantities for specified line items
/// - Optionally updates order status
/// - Returns updated aggregate
///
/// Semantics:
/// - All updates occur within a single transaction
/// - If any detail update fails (no rows affected), the operation aborts
///
/// Returns:
/// - `Ok(Some(...))` on success
/// - `Ok(None)` if order does not exist or a detail is invalid
///
/// Invariants:
/// - Purchase order must have at least one detail
/// - All referenced details must already exist
pub async fn patch_purchase_order(
    id: i32,
    patch: &update::PatchPurchaseOrderDto,
) -> Result<Option<order_model::PurchaseOrderAggregate>, db_config::DbError> {
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;


    let exists = tx
        .query_opt("SELECT 1 FROM purchase_orders WHERE id = $1", &[&id])
        .await?;

    if exists.is_none() {
        //implicit rollback here
        return Ok(None);
    }

    //Our update dto may not have a detail if the order is being cancelled. But it it has one, it is the first thing
    //it should update. So:
    if let Some(details) = &patch.details {
        for d in details{
            let sql = "UPDATE purchase_order_details SET received_quantity = $1 WHERE purchase_order_id = $2 AND product_id = $3";
            let affected = tx.execute(sql, &[&d.received_quantity, &id, &d.product_id])
                .await?;

            if affected == 0 {
                //implicit rollback here
                return Ok(None);
            }
        }
    }

    //Finally, we check if we must update the status too
    if let Some(status_id) = &patch.status_id {
        tx.execute("UPDATE purchase_orders SET status_id = $1 WHERE id = $2", &[&status_id, &id])
            .await?;

    }

    let sql = format!("{} WHERE po.id = $1 ORDER BY po.id, pod.id", PURCHASE_ORDER_SELECT_BASE);
    let rows = tx.query(&sql, &[&id]).await?;
    let purchase_order = rows_to_aggregate(rows).pop()
        .expect("This should always return the purchase order");


    tx.commit().await?;
    Ok(Some(purchase_order))
}

/// increases the received quantity of a product on a given order
pub async fn increase_received_quantity(
    tx: &tokio_postgres::Transaction<'_>,
    order_id: i32,
    product_id: i32,
    amount: i32,
) -> Result<bool, db_config::DbError> {
    let rows = tx.execute(
        "UPDATE purchase_order_details
         SET received_quantity = received_quantity + $1
         WHERE purchase_order_id = $2 AND product_id = $3",
         &[&amount, &order_id, &product_id],
    ).await?;

    Ok(rows == 1)
}

/// decreases the received quantity of a product on a given order
pub async fn decrease_received_quantity(
    tx: &tokio_postgres::Transaction<'_>,
    order_id: i32,
    product_id: i32,
    amount: i32,
) -> Result<bool, db_config::DbError> {
    let rows = tx.execute(
        "UPDATE purchase_order_details
         SET received_quantity = received_quantity - $1
         WHERE purchase_order_id = $2 AND product_id = $3 AND received_quantity >= $1",
         &[&amount, &order_id, &product_id],
    ).await?;

    Ok(rows == 1)
}
