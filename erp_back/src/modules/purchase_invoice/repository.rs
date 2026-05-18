//! Purchase invoice repository
//!
//! Handles all direct database interactions for the purchase invoice bounded context.
//! Only this module knows about SQL, column names, and row-to-model mapping.
//!
//! # Design
//! Mirrors `purchase_order::repository`:
//! - A `const` base query with all JOINs is shared across read functions
//! - `BTreeMap` groups flat JOIN rows into nested aggregates (one invoice → many details)
//! - All write functions receive a `Transaction` — reads receive a pooled `Client`
//! - Row mapping is private — callers never touch column names directly
//!
//! # Why INNER JOIN for details
//! All joins to `purchase_invoice_details` are INNER JOIN, so invoices without
//! any line items are never returned. This matches the domain invariant:
//! a purchase invoice must always have at least one item.
use deadpool_postgres::Client;
use tokio_postgres::Row;
use std::collections::BTreeMap;
use rust_decimal::Decimal;
use chrono::NaiveDate;

use crate::db_config;
use crate::modules::purchase_invoice::model::{
    Category, InvoiceLineItem, LineProduct,
    NewPurchaseInvoice, PurchaseInvoice, SaleCondition, Supplier,
};



// ── Base query ────────────────────────────────────────────────────────────────
 
/// Shared SELECT + FROM + JOINs reused by all read functions.
///
/// Fetches both the invoice header and all line item columns in one round trip,
/// avoiding N+1 queries. The WHERE clause is appended per function.
///
/// Column aliases are explicit to avoid ambiguity across joined tables.


const PURCHASE_INVOICES_SELECT_BASE: &str = r#"
SELECT 
    pi.id                   AS purchase_invoice_id,
    pi.invoice_nr           AS invoice_nr,  
    pi.purchase_order_id    AS purchase_order_id,
    pi.created_at           AS created_at,
    pi.sale_condition_id    AS sale_condition_id,
    sc.name                 AS sale_condition_name,
    pi.total                AS total,
    pi.total_paid           AS total_paid,
    po.supplier_id          AS supplier_id,
    s.name                  AS supplier_name,
    s.stamp                 AS supplier_stamp,
    p.id                    AS product_id,
    p.code                  AS product_code,
    p.description           AS product_description,
    ct.id                   AS category_id,
    ct.name                 AS category_name,
    pid.quantity            AS quantity,
    pid.unit_cost           AS unit_cost
FROM purchase_invoices pi
INNER JOIN purchase_orders po           ON pi.purchase_order_id     = po.id
INNER JOIN suppliers s                  ON po.supplier_id           = s.id 
INNER JOIN sale_conditions sc           ON pi.sale_condition_id     = sc.id 
INNER JOIN purchase_invoice_details pid ON pid.purchase_invoice_id  = pi.id
INNER JOIN products p                   ON p.id                     = pid.product_id
INNER JOIN categories ct                ON ct.id                    = p.category_id
"#;


// ── Row mapper ────────────────────────────────────────────────────────────────
 
/// Groups a flat list of JOIN rows into `PurchaseInvoice` structs with nested details.
///
/// Because each JOIN produces one row per line item, the invoice header columns
/// repeat N times. `BTreeMap` deduplicates by `purchase_invoice_id` and accumulates
/// line items into `details`, preserving insertion order.
///
/// `subtotal` is computed here as `unit_cost * quantity` — no need to store
/// a redundant derived column in the database.
///
/// Mirrors `rows_to_aggregate` in `purchase_order::repository`.
fn row_to_invoices(rows: Vec<Row>) -> Vec<PurchaseInvoice> {
    let mut map: BTreeMap<i32, PurchaseInvoice> = BTreeMap::new();

    for row in rows {
        let invoice_id: i32     = row.get("purchase_invoice_id");
        let unit_cost: Decimal  = row.get("unit_cost");
        let quantity: i32       = row.get("quantity");


        let entry = map.entry(invoice_id).or_insert_with(|| PurchaseInvoice {
            id:                invoice_id,
            invoice_nr:        row.get("invoice_nr"),
            purchase_order_id: row.get("purchase_order_id"),
            created_at:        row.get("created_at"),
            total:             row.get("total"),
            total_paid:        row.get("total_paid"),
            supplier: Supplier {
                id:    row.get("supplier_id"),
                name:  row.get("supplier_name"),
                stamp: row.get("supplier_stamp"),
            },
            sale_condition: SaleCondition {
                id:   row.get("sale_condition_id"),
                name: row.get("sale_condition_name"),
            },
            details: Vec::new(),
        });

        let details = InvoiceLineItem {
            product: LineProduct {
                id:         row.get("product_id"),
                code:       row.get("product_code"),
                name:       row.get("product_description"),
                category: Category {
                    id:     row.get("category_id"),
                    name:   row.get("category_name"),
                }
            },
            unit_cost,
            quantity,
            subtotal: unit_cost * Decimal::from(quantity),
        };

        entry.details.push(details);
    }
    map.into_values().collect()
}


// ── Read operations ───────────────────────────────────────────────────────────
 
/// Retrieves purchase invoices, optionally filtered by a search term.
///
/// Mirrors `query_orders` from `purchase_order::repository`.
///
/// # Filtering
/// When `contains` is provided, filters by:
/// - `invoice_nr` (ILIKE — partial, case-insensitive)
/// - `supplier name` (ILIKE — partial, case-insensitive)
/// - `purchase_order_id` (exact match, cast to TEXT)
///
/// When `contains` is `None`, returns all invoices unfiltered.
///
/// # Why if/else instead of $1::TEXT IS NULL
/// Matches the pattern used in `purchase_order::repository::query_orders` —
/// simpler to read and avoids the `COALESCE` trick.


pub async fn query_invoices(
    search: Option<&str>,
    filter: Option<&str>,
    since:  Option<NaiveDate>,
    to:     Option<NaiveDate>,
    status: Option<&str>,
    cursor: Option<i32>,
    limit:  i64,
) -> Result<Vec<PurchaseInvoice>, db_config::DbError> {

    let client = db_config::get_client().await?;

    let sql = format!("
        {}
        WHERE pi.id IN (
            SELECT pi2.id
            FROM purchase_invoices pi2
            WHERE ($1::INT  IS NULL OR pi2.id                      > $1)
              AND ($3::TEXT IS NULL OR pi2.purchase_order_id::TEXT = $3)
              AND ($4::DATE IS NULL OR pi2.created_at             >= $4)
              AND ($5::DATE IS NULL OR pi2.created_at             <= $5)
              AND ($6::TEXT IS NULL OR
                   CASE
                       WHEN $6 = 'paid'            THEN pi2.total_paid >= pi2.total
                       WHEN $6 = 'payment_pending' THEN pi2.total_paid >=  0
                                                    AND pi2.total_paid <  pi2.total
                       ELSE TRUE
                   END)
            ORDER BY pi2.id ASC
            LIMIT $7
        )
        AND ($2::TEXT IS NULL OR pi.invoice_nr ILIKE '%' || $2 || '%'
                              OR s.name        ILIKE '%' || $2 || '%')
        ORDER BY pi.id ASC, pid.id ASC
    ", PURCHASE_INVOICES_SELECT_BASE);

    let rows = client.query(
        &sql,
        &[&cursor, &search, &filter, &since, &to, &status, &limit],
    ).await?;

    Ok(row_to_invoices(rows))
}



/// Retrieves a single purchase invoice with all its line items.
///
/// Returns:
/// - `Ok(Some(...))` if an invoice with the given `id` exists
/// - `Ok(None)` if no matching invoice exists (service returns 404)
///
/// Mirrors `query_purchase_order_by_id` from `purchase_order::repository`.


pub async fn query_purchase_invoice_by_id(
    id: i32
) -> Result<Option<PurchaseInvoice>, db_config::DbError> {

    let client = db_config::get_client().await?;

    let sql = format!(
        "{} WHERE pi.id = $1 ORDER BY pi.id, pid.id ASC",
        PURCHASE_INVOICES_SELECT_BASE
    );

    let rows = client.query(&sql, &[&id]).await?;

    Ok(row_to_invoices(rows).into_iter().next())
}



// ── Write operations ──────────────────────────────────────────────────────────
 
/// Inserts a new purchase invoice and its line items within a transaction.
///
/// Receives a `Transaction` because invoice creation is always part of a
/// multi-step atomic operation — it also triggers stock and order quantity
/// updates in other modules. If any step fails, the service rolls back everything.
///
/// Returns the `id` of the newly created invoice so the service can use it
/// for downstream operations within the same transaction.
///
/// `tax` is stored as `0` for now — extend when tax rules are introduced.


pub async fn create(
    tx: &tokio_postgres::Transaction<'_>,
    invoice: &NewPurchaseInvoice,
) -> Result<i32, db_config::DbError> {

    // Insert the invoice header and capture the generated id
    let row = tx.query_one(
        "INSERT INTO purchase_invoices
            (invoice_nr, purchase_order_id, created_at, sale_condition_id, total)
         VALUES ($1, $2, CURRENT_DATE, $3, $4)
         RETURNING id",
        &[
            &invoice.invoice_nr,
            &invoice.purchase_order_id,
            &invoice.sale_condition_id,
            &invoice.total,
        ],
    ).await?;

    let invoice_id: i32 = row.get("id");

    // Insert each line item using the id we just obtained.
    // tax is stored as 0 for now — extend this when tax rules are introduced.
    for item in &invoice.items {
        tx.execute(
            "INSERT INTO purchase_invoice_details
                (purchase_invoice_id, product_id, unit_cost, tax, quantity)
             VALUES ($1, $2, $3, 0, $4)",
            &[
                &invoice_id,
                &item.product_id,
                &item.unit_cost,
                &item.quantity,
            ],
        ).await?;
    }

    Ok(invoice_id)
}