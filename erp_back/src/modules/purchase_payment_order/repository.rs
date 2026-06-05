//! # Purchase Payment Order Repository Layer
//!
//! This module is the **only place in the codebase that executes SQL** for the
//! purchase payment order domain.
//!
//! ## Responsibilities
//! - Execute `SELECT`, `INSERT`, and `UPDATE` queries against PostgreSQL
//! - Manage transactions for multi-step write operations
//! - Assemble raw JOIN rows into [`PurchasePaymentOrderWithDetails`] aggregates
//! - Compute derived values such as `total_to_pay` and invoice `pending_amount`
//!
//! ## What this module does NOT do
//! - Apply high-level business rules or HTTP validations
//! - Serialize/format data for API responses
//! - Decide which status IDs mean "Pending", "Approved", "Paid", etc.

use tokio_postgres::Row;
use rust_decimal::Decimal;
use chrono::NaiveDate;

use crate::db_config;
use crate::modules::purchase_payment_order::dto::create::CreatePurchasePaymentOrderDto;
use crate::modules::purchase_payment_order::model::*;

// ─────────────────────────────────────────────────────────────────────────────
// BASE QUERY
// ─────────────────────────────────────────────────────────────────────────────

/// Shared SELECT fragment reused by all read operations.
///
/// ## JOIN strategy
/// - `JOIN suppliers` — every payment order belongs to one supplier.
/// - `JOIN statuses` — every payment order has a workflow status.
/// - `LEFT JOIN employees requested` — requester is optional.
/// - `LEFT JOIN employees approved` — approver is optional.
/// - `LEFT JOIN purchase_payment_order_details` — allows loading the header even
///   if, for some reason, it has no details.
/// - `LEFT JOIN purchase_invoices` — each detail references an invoice.
///
/// ## Column aliasing
/// Explicit aliases are required because several tables have columns named
/// `id`, `created_at`, `observations`, etc.
const BASE_QUERY: &str = r#"
SELECT
    ppo.id                          AS payment_order_id,
    ppo.created_at                  AS payment_order_created_at,
    ppo.supplier_id                 AS payment_order_supplier_id,
    ppo.status_id                   AS payment_order_status_id,
    ppo.requested_by_employee_id    AS payment_order_requested_by_employee_id,
    ppo.approved_by_employee_id     AS payment_order_approved_by_employee_id,
    ppo.scheduled_payment_date      AS payment_order_scheduled_payment_date,
    ppo.observations                AS payment_order_observations,

    sup.id                          AS supplier_id,
    sup.name                        AS supplier_name,

    st.id                           AS status_id,
    st.status                       AS status_name,

    requested_emp.id                AS requested_employee_id,
    requested_emp.name              AS requested_employee_name,
    requested_emp.surname           AS requested_employee_surname,

    approved_emp.id                 AS approved_employee_id,
    approved_emp.name               AS approved_employee_name,
    approved_emp.surname            AS approved_employee_surname,

    ppod.id                         AS detail_id,
    ppod.purchase_invoice_id        AS detail_purchase_invoice_id,
    ppod.amount_to_pay              AS detail_amount_to_pay,
    ppod.observations               AS detail_observations,

    pi.id                           AS invoice_id,
    pi.invoice_nr                   AS invoice_nr,
    pi.purchase_order_id            AS invoice_purchase_order_id,
    pi.created_at                   AS invoice_created_at,
    pi.total                        AS invoice_total,
    pi.total_paid                   AS invoice_total_paid,
    (pi.total - pi.total_paid)      AS invoice_pending_amount

FROM purchase_payment_orders ppo
JOIN suppliers sup
    ON sup.id = ppo.supplier_id
JOIN statuses st
    ON st.id = ppo.status_id
LEFT JOIN employees requested_emp
    ON requested_emp.id = ppo.requested_by_employee_id
LEFT JOIN employees approved_emp
    ON approved_emp.id = ppo.approved_by_employee_id
LEFT JOIN purchase_payment_order_details ppod
    ON ppod.purchase_payment_order_id = ppo.id
LEFT JOIN purchase_invoices pi
    ON pi.id = ppod.purchase_invoice_id
"#;

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

/// Creates a new purchase payment order with all its invoice details inside
/// a single database transaction.
///
/// ## Transaction steps
/// 1. Reject if `dto.details` is empty.
/// 2. Insert the payment order header.
/// 3. Insert each invoice detail.
/// 4. Commit.
/// 5. Re-fetch the full aggregate via [`get_purchase_payment_order_by_id`].
///
/// ## Notes
/// - `created_at` is not inserted because the DB has `DEFAULT CURRENT_DATE`.
/// - `approved_by_employee_id` is not inserted on creation; it should be set
///   later when treasury/management approves the order.
/// - `amount_to_pay > 0` is enforced by the database check constraint.
/// - Duplicate invoices inside the same order are rejected by
///   `uq_payment_order_invoice`.
pub async fn create_purchase_payment_order(
    dto: CreatePurchasePaymentOrderDto,
) -> Result<PurchasePaymentOrderWithDetails, db_config::DbError> {
    if dto.details.is_empty() {
        return Err(db_config::DbError::Other(
            "Purchase payment order must have details".into(),
        ));
    }

    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    let row = tx
        .query_one(
            r#"
            INSERT INTO purchase_payment_orders
            (
                supplier_id,
                status_id,
                requested_by_employee_id,
                scheduled_payment_date,
                observations
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            "#,
            &[
                &dto.supplier_id,
                &dto.status_id,
                &dto.requested_by_employee_id,
                &dto.scheduled_payment_date,
                &dto.observations,
            ],
        )
        .await?;

    let payment_order_id: i32 = row.get("id");

    for d in dto.details {
        tx.execute(
            r#"
            INSERT INTO purchase_payment_order_details
            (
                purchase_payment_order_id,
                purchase_invoice_id,
                amount_to_pay,
                observations
            )
            VALUES ($1, $2, $3, $4)
            "#,
            &[
                &payment_order_id,
                &d.purchase_invoice_id,
                &d.amount_to_pay,
                &d.observations,
            ],
        )
        .await?;
    }

    tx.commit().await?;

    get_purchase_payment_order_by_id(payment_order_id)
        .await?
        .ok_or_else(|| db_config::DbError::NotFound)
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — LIST
// ─────────────────────────────────────────────────────────────────────────────

/// Retrieves all purchase payment orders, optionally filtering by text.
///
/// The optional `contains` filter searches by:
/// - payment order ID
/// - supplier name
/// - status name
/// - requester name/surname
/// - approver name/surname
/// - invoice number, using `EXISTS` so that all details of the matching order
///   are still returned.
///
/// Using `EXISTS` for invoice search is important. If we filtered directly with
/// `pi.invoice_nr ILIKE $1`, PostgreSQL would only return the matching detail row
/// and the aggregate would lose the other invoices from the same payment order.
pub async fn get_purchase_payment_orders(
    search: Option<String>,
    filter: Option<String>,
    since:  Option<NaiveDate>,
    to:     Option<NaiveDate>,
    status: Option<String>,
    cursor: Option<i32>,
    limit:  i64,
) -> Result<Vec<PurchasePaymentOrderWithDetails>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!(
        "
        {base_query}
        WHERE ppo.id IN (
            SELECT DISTINCT ppo2.id
            FROM purchase_payment_orders AS ppo2
            INNER JOIN statuses AS st2
                ON ppo2.status_id = st2.id
            INNER JOIN suppliers AS sup2
                ON ppo2.supplier_id = sup2.id
            LEFT JOIN purchase_payment_order_details AS ppod2
                ON ppod2.purchase_payment_order_id = ppo2.id
            LEFT JOIN purchase_invoices AS pi2
                ON ppod2.purchase_invoice_id = pi2.id
            WHERE ($1::INT IS NULL OR ppo2.id > $1)

            AND (
                $2::TEXT IS NULL
                OR ppo2.id::TEXT ILIKE '%' || $2 || '%'
                OR sup2.name ILIKE '%' || $2 || '%'
                OR st2.status ILIKE '%' || $2 || '%'
                OR pi2.invoice_nr ILIKE '%' || $2 || '%'
            )

            AND (
                $3::TEXT IS NULL
                OR ppo2.observations ILIKE '%' || $3 || '%'
                OR ppo2.id::TEXT ILIKE '%' || $3 || '%'
                OR sup2.name ILIKE '%' || $3 || '%'
                OR st2.status ILIKE '%' || $3 || '%'
                OR pi2.invoice_nr ILIKE '%' || $3 || '%'
            )

            AND ($4::DATE IS NULL OR ppo2.created_at >= $4)
            AND ($5::DATE IS NULL OR ppo2.created_at <= $5)

            AND (
                $6::TEXT IS NULL
                OR st2.status ILIKE '%' || $6 || '%'
            )

            ORDER BY ppo2.id ASC
            LIMIT $7
        )
        ORDER BY ppo.id ASC, ppod.id ASC
        ",
        base_query = BASE_QUERY
    );

    let rows = client
        .query(
            &sql,
            &[
                &cursor,
                &search,
                &filter,
                &since,
                &to,
                &status,
                &limit,
            ],
        )
        .await?;

    Ok(rows_to_aggregate(rows))
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — SINGLE
// ─────────────────────────────────────────────────────────────────────────────

/// Retrieves a single purchase payment order by its primary key.
///
/// Returns:
/// - `Ok(Some(...))` when found.
/// - `Ok(None)` when no payment order exists with that ID.
/// - `Err(...)` when the query fails.
pub async fn get_purchase_payment_order_by_id(
    id: i32,
) -> Result<Option<PurchasePaymentOrderWithDetails>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!(
        "{BASE_QUERY}
         WHERE ppo.id = $1
         ORDER BY ppo.id, ppod.id"
    );

    let rows = client.query(&sql, &[&id]).await?;
    let data = rows_to_aggregate(rows);

    Ok(data.into_iter().next())
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — STATUS
// ─────────────────────────────────────────────────────────────────────────────

/// Updates only the status of a purchase payment order.
///
/// Useful for transitions such as:
/// - Pending → Cancelled
/// - Approved → Paid
/// - Pending → Rejected
///
/// The service layer should decide whether the transition is allowed.
pub async fn update_purchase_payment_order_status(
    id: i32,
    status_id: i32,
) -> Result<PurchasePaymentOrderWithDetails, db_config::DbError> {
    let client = db_config::get_client().await?;

    let updated = client
        .execute(
            r#"
            UPDATE purchase_payment_orders
            SET status_id = $1
            WHERE id = $2
            "#,
            &[&status_id, &id],
        )
        .await?;

    if updated == 0 {
        return Err(db_config::DbError::NotFound);
    }

    get_purchase_payment_order_by_id(id)
        .await?
        .ok_or_else(|| db_config::DbError::NotFound)
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — APPROVE
// ─────────────────────────────────────────────────────────────────────────────

/// Approves a purchase payment order.
///
/// This sets:
/// - `approved_by_employee_id`
/// - `status_id`
///
/// The meaning of `approved_status_id` should be handled by the service layer
/// or a status catalog.
pub async fn approve_purchase_payment_order(
    id: i32,
    approved_by_employee_id: i32,
    approved_status_id: i32,
) -> Result<PurchasePaymentOrderWithDetails, db_config::DbError> {
    let client = db_config::get_client().await?;

    let updated = client
        .execute(
            r#"
            UPDATE purchase_payment_orders
            SET
                approved_by_employee_id = $1,
                status_id = $2
            WHERE id = $3
            "#,
            &[&approved_by_employee_id, &approved_status_id, &id],
        )
        .await?;

    if updated == 0 {
        return Err(db_config::DbError::NotFound);
    }

    get_purchase_payment_order_by_id(id)
        .await?
        .ok_or_else(|| db_config::DbError::NotFound)
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATION HELPER
// ─────────────────────────────────────────────────────────────────────────────

/// Collapses a flat list of JOIN rows into
/// [`PurchasePaymentOrderWithDetails`] aggregates.
///
/// `BASE_QUERY` returns one row per detail line. This helper merges rows that
/// belong to the same payment order.
///
/// It also computes:
/// - `total_to_pay` from the sum of `amount_to_pay`.
/// - invoice `pending_amount` from `total - total_paid`.
fn rows_to_aggregate(rows: Vec<Row>) -> Vec<PurchasePaymentOrderWithDetails> {
    use std::collections::BTreeMap;

    let mut map: BTreeMap<i32, PurchasePaymentOrderWithDetails> = BTreeMap::new();

    for row in rows {
        let id: i32 = row.get("payment_order_id");

        let payment_order_supplier_id: i32 = row.get("payment_order_supplier_id");
        let payment_order_status_id: i32 = row.get("payment_order_status_id");
        let requested_by_employee_id: Option<i32> =
            row.get("payment_order_requested_by_employee_id");
        let approved_by_employee_id: Option<i32> =
            row.get("payment_order_approved_by_employee_id");

        let supplier_id: i32 = row.get("supplier_id");
        let status_id: i32 = row.get("status_id");

        let requested_employee_id: Option<i32> = row.get("requested_employee_id");
        let approved_employee_id: Option<i32> = row.get("approved_employee_id");

        let requested_by_employee = requested_employee_id.map(|employee_id| {
            PurchasePaymentOrderEmployee {
                id: employee_id,
                name: row
                    .get::<_, Option<String>>("requested_employee_name")
                    .unwrap_or_default(),
                surname: row
                    .get::<_, Option<String>>("requested_employee_surname")
                    .unwrap_or_default(),
            }
        });

        let approved_by_employee = approved_employee_id.map(|employee_id| {
            PurchasePaymentOrderEmployee {
                id: employee_id,
                name: row
                    .get::<_, Option<String>>("approved_employee_name")
                    .unwrap_or_default(),
                surname: row
                    .get::<_, Option<String>>("approved_employee_surname")
                    .unwrap_or_default(),
            }
        });

        let entry = map.entry(id).or_insert_with(|| PurchasePaymentOrderWithDetails {
            payment_order: PurchasePaymentOrder {
                id,
                created_at: row.get("payment_order_created_at"),
                supplier_id: payment_order_supplier_id,
                status_id: payment_order_status_id,
                requested_by_employee_id,
                approved_by_employee_id,
                scheduled_payment_date: row.get("payment_order_scheduled_payment_date"),
                observations: row.get("payment_order_observations"),
            },
            supplier: PurchasePaymentOrderSupplier {
                id: supplier_id,
                name: row.get("supplier_name"),
            },
            status: PurchasePaymentOrderStatus {
                id: status_id,
                status: row.get("status_name"),
            },
            requested_by_employee,
            approved_by_employee,
            total_to_pay: Decimal::ZERO,
            details: vec![],
        });

        let detail_id: Option<i32> = row.get("detail_id");

        if let Some(detail_id) = detail_id {
            let amount_to_pay: Decimal = row.get("detail_amount_to_pay");

            entry.total_to_pay += amount_to_pay;

            entry.details.push(PurchasePaymentOrderDetail {
                id: detail_id,
                purchase_payment_order_id: id,
                purchase_invoice: PurchasePaymentOrderInvoice {
                    id: row.get("invoice_id"),
                    invoice_nr: row.get("invoice_nr"),
                    purchase_order_id: row.get("invoice_purchase_order_id"),
                    created_at: row.get("invoice_created_at"),
                    total: row.get("invoice_total"),
                    total_paid: row.get("invoice_total_paid"),
                    pending_amount: row.get("invoice_pending_amount"),
                },
                amount_to_pay,
                observations: row.get("detail_observations"),
            });
        }
    }

    map.into_values().collect()
}
