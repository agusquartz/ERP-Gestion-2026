//! Purchase invoice response DTOs
//!
//! Two response shapes from the same domain model:
//! - `PurchaseInvoiceResponse`: summary for the list (no line items)
//! - `PurchaseInvoiceDetailResponse`: full detail for GET by id (with line items)
//! - `PaginatedInvoicesResponse`: envelope returned by the list endpoint
use serde::{Deserialize, Serialize};
use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::modules::purchase_invoice::model;

// ── Sub-DTOs ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupplierResponse {
    pub id: i32,
    pub name: String,
    pub stamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleConditionResponse {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryResponse {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineProductResponse {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub category: CategoryResponse,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceLineItemResponse {
    pub product: LineProductResponse,
    pub unit_cost: Decimal,
    pub quantity: i32,
    pub subtotal: Decimal,
}

// ── Payment status ────────────────────────────────────────────────────────────

/// Derived from `total` vs `total_paid` on every read — never stored in DB.
///
/// Serialized as snake_case to match the `case` values in frontend `utils.js`:
/// `"paid"`, `"partial_payment"`, `"payment_pending"`
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PaymentStatus {
    Paid,
    PaymentPending,
}

impl PaymentStatus {
    pub fn from_totals(total: Decimal, total_paid: Decimal) -> Self {
        if total_paid >= total {
            PaymentStatus::Paid
        } else {
            PaymentStatus::PaymentPending
        }
    }
}

// ── List response ─────────────────────────────────────────────────────────────

/// Summary row for the paginated list — no line items.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseInvoiceResponse {
    pub id: i32,
    pub invoice_nr: String,
    pub purchase_order_id: i32,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub total_paid: Decimal,
    pub supplier: SupplierResponse,
    pub sale_condition: SaleConditionResponse,
    pub payment_status: PaymentStatus,
}

impl From<model::PurchaseInvoice> for PurchaseInvoiceResponse {
    fn from(m: model::PurchaseInvoice) -> Self {
        let payment_status = PaymentStatus::from_totals(m.total, m.total_paid);
        Self {
            id:                m.id,
            invoice_nr:        m.invoice_nr,
            purchase_order_id: m.purchase_order_id,
            created_at:        m.created_at,
            total:             m.total,
            total_paid:        m.total_paid,
            supplier: SupplierResponse {
                id:    m.supplier.id,
                name:  m.supplier.name,
                stamp: m.supplier.stamp,
            },
            sale_condition: SaleConditionResponse {
                id:   m.sale_condition.id,
                name: m.sale_condition.name,
            },
            payment_status,
        }
    }
}

/// Paginated envelope returned by GET /purchases/purchase-invoices.
///
/// `next_cursor` is the `id` of the last item in `data`.
/// The frontend stores it and sends it as `?cursor=N` to fetch the next page.
/// `has_more` tells the frontend whether to show a "next page" button.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedInvoicesResponse {
    pub data:        Vec<PurchaseInvoiceResponse>,
    pub next_cursor: Option<i32>,
    pub has_more:    bool,
}

// ── Detail response ───────────────────────────────────────────────────────────

/// Full detail for GET /purchases/purchase-invoices/:id — includes line items.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseInvoiceDetailResponse {
    pub id: i32,
    pub invoice_nr: String,
    pub purchase_order_id: i32,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub total_paid: Decimal,
    pub supplier: SupplierResponse,
    pub sale_condition: SaleConditionResponse,
    pub payment_status: PaymentStatus,
    pub details: Vec<InvoiceLineItemResponse>,
}

impl From<model::PurchaseInvoice> for PurchaseInvoiceDetailResponse {
    fn from(m: model::PurchaseInvoice) -> Self {
        let payment_status = PaymentStatus::from_totals(m.total, m.total_paid);
        Self {
            id:                m.id,
            invoice_nr:        m.invoice_nr,
            purchase_order_id: m.purchase_order_id,
            created_at:        m.created_at,
            total:             m.total,
            total_paid:        m.total_paid,
            supplier: SupplierResponse {
                id:   m.supplier.id,
                name: m.supplier.name,
                stamp: m.supplier.stamp,
            },
            sale_condition: SaleConditionResponse {
                id:   m.sale_condition.id,
                name: m.sale_condition.name,
            },
            payment_status,
            details: m.details.into_iter().map(|d| InvoiceLineItemResponse {
                product: LineProductResponse {
                    id:   d.product.id,
                    code: d.product.code,
                    name: d.product.name,
                    category: CategoryResponse {
                        id:   d.product.category.id,
                        name: d.product.category.name,
                    },
                },
                unit_cost: d.unit_cost,
                quantity:  d.quantity,
                subtotal:  d.subtotal,
            }).collect(),
        }
    }
}