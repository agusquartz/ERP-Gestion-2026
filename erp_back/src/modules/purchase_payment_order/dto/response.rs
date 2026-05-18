//! # Purchase Payment Order Response DTO
//!
//! Defines the **JSON shape returned by purchase payment order endpoints**.
//!
//! ## Why a dedicated response type?
//! The database model for payment orders usually comes from multiple JOINs:
//! - `purchase_payment_orders`
//! - `purchase_payment_order_details`
//! - `suppliers`
//! - `statuses`
//! - `employees`
//! - `purchase_invoices`
//!
//! Exposing the internal model directly would couple the API response to the
//! persistence layer.
//!
//! ## Conversion
//! These structs should be produced by a mapper, for example:
//! `purchase_payment_order_with_details_to_response(...)`.
//!
//! ## Naming convention
//! `#[serde(rename_all = "camelCase")]` ensures fields like `created_at`,
//! `scheduled_payment_date` and `amount_to_pay` are serialized as
//! `createdAt`, `scheduledPaymentDate` and `amountToPay`.

use serde::{Serialize, Deserialize};
use rust_decimal::Decimal;

/// The top-level JSON object returned for a purchase payment order.
///
/// Returned as a single object by `GET /purchase-payment-orders/{id}` and
/// `POST /purchase-payment-orders`, and as an element in the array returned by
/// `GET /purchase-payment-orders`.
///
/// # Example JSON
/// ```json
/// {
///   "id": 1,
///   "createdAt": "2026-05-08",
///   "scheduledPaymentDate": "2026-05-15",
///   "observations": "Pagar facturas vencidas del proveedor.",
///   "status": { "id": 1, "name": "Pending" },
///   "supplier": { "id": 3, "name": "Proveedor ABC" },
///   "requestedByEmployee": { "id": 8, "name": "Ana", "surname": "Gomez" },
///   "approvedByEmployee": null,
///   "totalToPay": "2300000.00",
///   "details": [
///     {
///       "purchaseInvoice": {
///         "id": 12,
///         "invoiceNr": "001-001-0000012",
///         "createdAt": "2026-05-01",
///         "total": "2000000.00",
///         "totalPaid": "500000.00",
///         "pendingAmount": "1500000.00"
///       },
///       "amountToPay": "1500000.00",
///       "observations": "Pago parcial"
///     }
///   ]
/// }
/// ```
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchasePaymentOrderResponseDto {
    /// Database-generated primary key of the payment order.
    pub id: i32,

    /// Creation date serialized as `"YYYY-MM-DD"`.
    pub created_at: String,

    /// Planned payment date serialized as `"YYYY-MM-DD"`.
    pub scheduled_payment_date: Option<String>,

    /// Optional header-level notes.
    pub observations: Option<String>,

    /// Current workflow status of the payment order.
    pub status: PurchasePaymentOrderStatusResponseDto,

    /// Supplier associated with this payment order.
    pub supplier: PurchasePaymentOrderSupplierResponseDto,

    /// Employee who requested the payment order.
    pub requested_by_employee: Option<PurchasePaymentOrderEmployeeResponseDto>,

    /// Employee who approved the payment order.
    ///
    /// Usually `null` while the order is still pending.
    pub approved_by_employee: Option<PurchasePaymentOrderEmployeeResponseDto>,

    /// Sum of all detail `amount_to_pay` values.
    ///
    /// Computed server-side from the detail lines.
    pub total_to_pay: Decimal,

    /// Invoices included in this payment order.
    ///
    /// Empty array `[]` on list endpoints that do not load details.
    pub details: Vec<PurchasePaymentOrderDetailResponseDto>,
}

/// Nested status object within [`PurchasePaymentOrderResponseDto`].
#[derive(Debug, Serialize, Deserialize)]
pub struct PurchasePaymentOrderStatusResponseDto {
    /// Primary key of the status.
    pub id: i32,

    /// Human-readable status label.
    pub name: String,
}

/// Nested supplier object within [`PurchasePaymentOrderResponseDto`].
///
/// Add more fields here if your `suppliers` table has them, for example:
/// `document`, `ruc`, `email`, etc.
#[derive(Debug, Serialize, Deserialize)]
pub struct PurchasePaymentOrderSupplierResponseDto {
    /// Primary key of the supplier.
    pub id: i32,

    /// Supplier display name.
    pub name: String,
}

/// Nested employee object used for requester and approver.
#[derive(Debug, Serialize, Deserialize)]
pub struct PurchasePaymentOrderEmployeeResponseDto {
    /// Primary key of the employee.
    pub id: i32,

    /// Employee first name.
    pub name: String,

    /// Employee surname.
    pub surname: String,
}

/// Nested purchase invoice object within a payment order detail.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchasePaymentOrderInvoiceResponseDto {
    /// Primary key of the purchase invoice.
    pub id: i32,

    /// Invoice number.
    pub invoice_nr: String,

    /// Invoice issue/creation date serialized as `"YYYY-MM-DD"`.
    pub created_at: String,

    /// Original invoice total.
    pub total: Decimal,

    /// Amount already paid before this payment order.
    pub total_paid: Decimal,

    /// Pending balance: `total - total_paid`.
    pub pending_amount: Decimal,
}

/// A single invoice line within the payment order response.
///
/// Note: `id` is intentionally omitted because API consumers can identify each
/// line by the invoice, and your table already prevents repeating the same
/// invoice inside the same payment order.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchasePaymentOrderDetailResponseDto {
    /// Invoice associated with this payment order line.
    pub purchase_invoice: PurchasePaymentOrderInvoiceResponseDto,

    /// Amount requested to pay for this invoice.
    pub amount_to_pay: Decimal,

    /// Optional line-level note.
    pub observations: Option<String>,
}