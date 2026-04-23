use std::collections::BTreeMap;
use tokio_postgres::Row;

use crate::modules::purchase_order::model::{self,
                                            new_order_model, 
                                            order_model};
use crate::db_config;

const PURCHASE_ORDER_SELECT_BASE: &str = r#"
SELECT 
    po.id AS purchase_order_id,
    po.purchase_request_id AS purchase_request_id,
    po.created_at AS created_at,
    s.id AS supplier_id,
    s.name AS supplier_name,
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

pub async fn query_purchase_order_by_id(id: i32) -> Result<Option<order_model::PurchaseOrderAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;


    let sql = format!("{} WHERE po.id = $1 ORDER BY po.id, pod.id", PURCHASE_ORDER_SELECT_BASE);

    let rows = client.query(&sql, &[&id]).await?;

    let orders = rows_to_aggregate(rows);


    Ok(orders.into_iter().next())
}

pub async fn query_orders(contains: Option<&str>) -> Result<Vec<order_model::PurchaseOrderAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;
    if let Some(q) = contains {
        let sql = format!("{} WHERE (COALESCE($1, '') = '' OR supplier_name ILIKE '%' || $1 || '%' OR status_name ILIKE '%' || $1 || '%' OR created_at ILIKE '%' || $1 || '%') ORDER BY purchase_order_id, pod.id", PURCHASE_ORDER_SELECT_BASE); 
    
        let rows = client.query(&sql, &[&q]).await?;
        let aggregates = rows_to_aggregate(rows);
        return Ok(aggregates)
    }
    let sql = PURCHASE_ORDER_SELECT_BASE.to_string();
    let rows = client.query(&sql, &[]).await?;
    Ok(rows_to_aggregate(rows))
}

fn rows_to_aggregate(rows: Vec<Row>) -> Vec<order_model::PurchaseOrderAggregate> {
    let mut map: BTreeMap<i32, order_model::PurchaseOrderAggregate> = BTreeMap::new();

    for row in rows {
        let order_id: i32 = row.get("purchase_order_id");

        let supplier = order_model::Supplier {
            id: row.get("supplier_id"),
            name: row.get("supplier_name"),
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
                &detail.product.id,
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

//TODO: patch purchase order
