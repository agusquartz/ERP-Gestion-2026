//! # Update Purchase Payment Order DTO
//!
//! Defines request body shapes for partial update endpoints related to
//! purchase payment orders.
//!
//! These DTOs are used by PATCH endpoints such as:
//! - `PATCH /purchase-payment-orders/{id}/status`
//! - `PATCH /purchase-payment-orders/{id}/approve`

use serde::Deserialize;

/// Payload received by `PATCH /purchase-payment-orders/{id}/status`.
///
/// # Example JSON
/// ```json
/// {
///   "statusId": 3
/// }
/// ```
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePurchasePaymentOrderStatusDto {
    /// New workflow status ID.
    pub status_id: i32,
}

/// Payload received by `PATCH /purchase-payment-orders/{id}/approve`.
///
/// # Example JSON
/// ```json
/// {
///   "approvedByEmployeeId": 7,
///   "approvedStatusId": 2
/// }
/// ```
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovePurchasePaymentOrderDto {
    /// Employee approving the payment order.
    pub approved_by_employee_id: i32,

    /// Status ID that represents "Approved".
    pub approved_status_id: i32,
}