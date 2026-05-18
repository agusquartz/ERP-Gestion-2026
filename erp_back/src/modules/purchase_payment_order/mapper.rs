//! # Purchase Payment Order Mapper Layer
//!
//! This module is responsible for **transforming data between representations**.
//!
//! It sits between the repository layer, which works with domain models, and the
//! service/handler layers, which work with DTOs.
//!
//! ## Responsibilities
//! - Convert [`PurchasePaymentOrderWithDetails`] domain aggregates into
//!   [`PurchasePaymentOrderResponseDto`] API responses.
//! - Optionally collapse raw database rows into lightweight payment order
//!   aggregates for list-style queries.
//! - Keep transformation logic out of services and handlers.
//!
//! ## What this module does NOT do
//! - Execute SQL queries — that belongs to the repository.
//! - Apply business rules — that belongs to the service.
//! - Interact with HTTP types — that belongs to handlers.
//!
//! ## Main mapping function
//! [`purchase_payment_order_with_details_to_response`] is the primary function
//! used by the service layer.

use tokio_postgres::Row;
use rust_decimal::Decimal;

use crate::modules::purchase_payment_order::model::*;
use crate::modules::purchase_payment_order::dto::response::*;

/// Collapses raw database rows into [`PurchasePaymentOrderWithDetails`] aggregates
/// without populating the `details` array.
///
/// This function is useful for list queries where you want header information,
/// supplier, status, requester/approver and `total_to_pay`, but not the full
/// invoice detail breakdown.
///
/// ## Important
/// This function expects rows containing the same aliases used by the repository
/// `BASE_QUERY`, such as:
/// - `payment_order_id`
/// - `payment_order_created_at`
/// - `supplier_name`
/// - `status_name`
/// - `detail_amount_to_pay`
///
/// Unlike the full repository aggregation helper, this function **does not push
/// invoice details** into the aggregate. It only sums `amount_to_pay` into
/// `total_to_pay`.
///
/// # Parameters
/// - `rows`: Raw rows returned by a `tokio_postgres` query.
///
/// # Returns
/// A `Vec<PurchasePaymentOrderWithDetails>` with `details: vec![]`.
pub fn rows_to_simple_purchase_payment_orders(
    rows: Vec<Row>,
) -> Vec<PurchasePaymentOrderWithDetails> {
    use std::collections::BTreeMap;

    let mut map: BTreeMap<i32, PurchasePaymentOrderWithDetails> = BTreeMap::new();

    for row in rows {
        let id: i32 = row.get("payment_order_id");

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
                supplier_id: row.get("payment_order_supplier_id"),
                status_id: row.get("payment_order_status_id"),
                requested_by_employee_id: row.get("payment_order_requested_by_employee_id"),
                approved_by_employee_id: row.get("payment_order_approved_by_employee_id"),
                scheduled_payment_date: row.get("payment_order_scheduled_payment_date"),
                observations: row.get("payment_order_observations"),
            },
            supplier: PurchasePaymentOrderSupplier {
                id: row.get("supplier_id"),
                name: row.get("supplier_name"),
            },
            status: PurchasePaymentOrderStatus {
                id: row.get("status_id"),
                status: row.get("status_name"),
            },
            requested_by_employee,
            approved_by_employee,
            total_to_pay: Decimal::ZERO,
            details: vec![],
        });

        let detail_id: Option<i32> = row.get("detail_id");

        if detail_id.is_some() {
            let amount_to_pay: Decimal = row.get("detail_amount_to_pay");
            entry.total_to_pay += amount_to_pay;
        }
    }

    map.into_values().collect()
}

/// Converts a fully hydrated [`PurchasePaymentOrderWithDetails`] domain aggregate
/// into a [`PurchasePaymentOrderResponseDto`] ready for JSON serialization.
///
/// This is the primary mapper used by the service layer for:
/// - `POST /purchase-payment-orders`
/// - `GET /purchase-payment-orders/{id}`
/// - `GET /purchase-payment-orders`
/// - `PATCH /purchase-payment-orders/{id}/status`
/// - `PATCH /purchase-payment-orders/{id}/approve`
///
/// ## Field mappings
/// | Model field | DTO field | Notes |
/// |---|---|---|
/// | `payment_order.id` | `id` | Direct copy |
/// | `payment_order.created_at` | `created_at` | `.to_string()` |
/// | `payment_order.scheduled_payment_date` | `scheduled_payment_date` | `Option<NaiveDate>` → `Option<String>` |
/// | `payment_order.observations` | `observations` | Direct copy |
/// | `status.status` | `status.name` | Renamed for API clarity |
/// | `supplier.*` | `supplier.*` | Direct copy |
/// | `requested_by_employee` | `requested_by_employee` | Nullable nested object |
/// | `approved_by_employee` | `approved_by_employee` | Nullable nested object |
/// | `total_to_pay` | `total_to_pay` | Computed in repository |
/// | `details[]` | `details[]` | Invoice payment lines |
///
/// ## Ownership
/// This function consumes the domain model by value, so no cloning is needed.
pub fn purchase_payment_order_with_details_to_response(
    model: PurchasePaymentOrderWithDetails,
) -> PurchasePaymentOrderResponseDto {
    PurchasePaymentOrderResponseDto {
        id: model.payment_order.id,

        created_at: model.payment_order.created_at.to_string(),

        scheduled_payment_date: model
            .payment_order
            .scheduled_payment_date
            .map(|date| date.to_string()),

        observations: model.payment_order.observations,

        status: PurchasePaymentOrderStatusResponseDto {
            id: model.status.id,
            name: model.status.status,
        },

        supplier: PurchasePaymentOrderSupplierResponseDto {
            id: model.supplier.id,
            name: model.supplier.name,
        },

        requested_by_employee: model
            .requested_by_employee
            .map(|employee| PurchasePaymentOrderEmployeeResponseDto {
                id: employee.id,
                name: employee.name,
                surname: employee.surname,
            }),

        approved_by_employee: model
            .approved_by_employee
            .map(|employee| PurchasePaymentOrderEmployeeResponseDto {
                id: employee.id,
                name: employee.name,
                surname: employee.surname,
            }),

        total_to_pay: model.total_to_pay,

        details: model
            .details
            .into_iter()
            .map(|detail| PurchasePaymentOrderDetailResponseDto {
                purchase_invoice: PurchasePaymentOrderInvoiceResponseDto {
                    id: detail.purchase_invoice.id,
                    invoice_nr: detail.purchase_invoice.invoice_nr,
                    created_at: detail.purchase_invoice.created_at.to_string(),
                    total: detail.purchase_invoice.total,
                    total_paid: detail.purchase_invoice.total_paid,
                    pending_amount: detail.purchase_invoice.pending_amount,
                },
                amount_to_pay: detail.amount_to_pay,
                observations: detail.observations,
            })
            .collect(),
    }
}