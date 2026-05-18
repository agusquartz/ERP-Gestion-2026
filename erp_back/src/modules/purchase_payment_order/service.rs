//! # Purchase Payment Order Service Layer
//!
//! This module sits between the HTTP handlers and the repository.
//! It is the **home of business logic** for the purchase payment order domain.
//!
//! ## Responsibilities
//! - Validate business rules before calling the repository
//! - Orchestrate repository calls
//! - Map repository aggregates to response DTOs through the mapper layer
//! - Translate missing records into [`DbError::NotFound`]
//!
//! ## What this module does NOT do
//! - Execute SQL — that belongs to the repository layer.
//! - Interact with HTTP types like `StatusCode` or `Json` — that belongs to handlers.
//! - Serialize JSON — that belongs to DTOs and Axum.
//!
//! ## Error handling
//! All functions return `Result<_, DbError>`. The handler layer is responsible
//! for converting these errors into HTTP responses.

use rust_decimal::Decimal;

use crate::db_config::DbError;

use crate::modules::purchase_payment_order::{
    dto::create::CreatePurchasePaymentOrderDto,
    dto::response::PurchasePaymentOrderResponseDto,
    repository,
    mapper,
};

/// Creates a new purchase payment order and returns it as a response DTO.
///
/// ## Business validation
/// Rejects the request if:
/// - `details` is empty.
/// - any detail has `amount_to_pay <= 0`.
/// - the same invoice appears more than once in the request payload.
///
/// Some of these rules are also protected by database constraints, but validating
/// them here allows the API to return clearer business-level errors before
/// attempting a transaction.
///
/// ## Flow
/// 1. Validate the payment order payload.
/// 2. Delegate to [`repository::create_purchase_payment_order`].
/// 3. Map the returned aggregate into [`PurchasePaymentOrderResponseDto`].
///
/// # Parameters
/// - `dto`: The deserialized create payload from the HTTP request body.
///
/// # Returns
/// - `Ok(PurchasePaymentOrderResponseDto)`: Created payment order.
/// - `Err(DbError::Other(...))`: Business validation failed.
/// - `Err(DbError)`: Repository/database operation failed.
pub async fn create_purchase_payment_order(
    dto: CreatePurchasePaymentOrderDto,
) -> Result<PurchasePaymentOrderResponseDto, DbError> {
    validate_create_purchase_payment_order(&dto)?;

    let payment_order = repository::create_purchase_payment_order(dto).await?;

    Ok(mapper::purchase_payment_order_with_details_to_response(payment_order))
}

/// Retrieves a single purchase payment order by its primary key.
///
/// Converts `Ok(None)` from the repository into [`DbError::NotFound`], allowing
/// the handler layer to return HTTP 404.
///
/// ## Flow
/// 1. Call [`repository::get_purchase_payment_order_by_id`].
/// 2. Convert `None` into `DbError::NotFound`.
/// 3. Map the aggregate into a response DTO.
///
/// # Parameters
/// - `id`: Primary key of the purchase payment order.
///
/// # Returns
/// - `Ok(PurchasePaymentOrderResponseDto)`: Payment order found.
/// - `Err(DbError::NotFound)`: No payment order exists with this ID.
/// - `Err(DbError)`: Database query failed.
pub async fn get_purchase_payment_order_by_id(
    id: i32,
) -> Result<PurchasePaymentOrderResponseDto, DbError> {
    let payment_order = repository::get_purchase_payment_order_by_id(id)
        .await?
        .ok_or(DbError::NotFound)?;

    Ok(mapper::purchase_payment_order_with_details_to_response(payment_order))
}

/// Retrieves all purchase payment orders, optionally filtered by a search string.
///
/// When `contains` is `Some(...)`, the repository applies a case-insensitive
/// search across fields such as:
/// - payment order ID
/// - supplier name
/// - status name
/// - requester/approver name
/// - invoice number
///
/// ## Flow
/// 1. Delegate to [`repository::get_purchase_payment_orders`].
/// 2. Map every aggregate into a response DTO.
///
/// # Parameters
/// - `contains`: Optional text filter. `None` returns all payment orders.
///
/// # Returns
/// - `Ok(Vec<PurchasePaymentOrderResponseDto>)`: Possibly empty list.
/// - `Err(DbError)`: Database query failed.
pub async fn get_purchase_payment_orders(
    contains: Option<String>,
) -> Result<Vec<PurchasePaymentOrderResponseDto>, DbError> {
    let payment_orders = repository::get_purchase_payment_orders(contains).await?;

    Ok(payment_orders
        .into_iter()
        .map(mapper::purchase_payment_order_with_details_to_response)
        .collect())
}

/// Updates only the status of a purchase payment order.
///
/// This is useful for general state transitions such as:
/// - pending → cancelled
/// - approved → paid
/// - pending → rejected
///
/// The handler or route can expose this as something like:
///
/// ```text
/// PATCH /purchase-payment-orders/{id}/status
/// ```
///
/// ## Important
/// This function does not know which status IDs are valid transitions.
/// If your app has strict workflow rules, validate them here before calling
/// the repository.
///
/// # Parameters
/// - `id`: Purchase payment order ID.
/// - `status_id`: New status ID.
///
/// # Returns
/// - `Ok(PurchasePaymentOrderResponseDto)`: Updated payment order.
/// - `Err(DbError::NotFound)`: Payment order does not exist.
/// - `Err(DbError)`: Database operation failed.
pub async fn update_purchase_payment_order_status(
    id: i32,
    status_id: i32,
) -> Result<PurchasePaymentOrderResponseDto, DbError> {
    if status_id <= 0 {
        return Err(DbError::Other(
            "Status ID must be a positive integer".to_string(),
        ));
    }

    let payment_order = repository::update_purchase_payment_order_status(id, status_id).await?;

    Ok(mapper::purchase_payment_order_with_details_to_response(payment_order))
}

/// Approves a purchase payment order.
///
/// This operation sets:
/// - `approved_by_employee_id`
/// - `status_id`
///
/// The `approved_status_id` should be the ID of the status that represents
/// `"Approved"` in your `statuses` table.
///
/// This can be exposed as:
///
/// ```text
/// PATCH /purchase-payment-orders/{id}/approve
/// ```
///
/// # Parameters
/// - `id`: Purchase payment order ID.
/// - `approved_by_employee_id`: Employee approving the order.
/// - `approved_status_id`: Status ID to assign after approval.
///
/// # Returns
/// - `Ok(PurchasePaymentOrderResponseDto)`: Approved payment order.
/// - `Err(DbError::NotFound)`: Payment order does not exist.
/// - `Err(DbError::Other(...))`: Invalid input.
/// - `Err(DbError)`: Database operation failed.
pub async fn approve_purchase_payment_order(
    id: i32,
    approved_by_employee_id: i32,
    approved_status_id: i32,
) -> Result<PurchasePaymentOrderResponseDto, DbError> {
    if approved_by_employee_id <= 0 {
        return Err(DbError::Other(
            "Approved-by employee ID must be a positive integer".to_string(),
        ));
    }

    if approved_status_id <= 0 {
        return Err(DbError::Other(
            "Approved status ID must be a positive integer".to_string(),
        ));
    }

    let payment_order = repository::approve_purchase_payment_order(
        id,
        approved_by_employee_id,
        approved_status_id,
    )
    .await?;

    Ok(mapper::purchase_payment_order_with_details_to_response(payment_order))
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/// Validates the create payload before it reaches the repository.
///
/// Business rules enforced here:
/// - The order must belong to a valid supplier ID.
/// - The order must have a valid status ID.
/// - The order must contain at least one invoice detail.
/// - Every detail must reference a valid invoice ID.
/// - Every `amount_to_pay` must be greater than zero.
/// - The same invoice cannot appear twice in the same request.
///
/// Rules that still should be validated elsewhere:
/// - Each invoice must belong to the selected supplier.
/// - `amount_to_pay` must not exceed the invoice pending balance.
/// - Status must be a valid initial status for payment orders.
///
/// Those rules usually require database reads, so they can be added either here
/// with extra repository helper functions, or inside the repository transaction.
fn validate_create_purchase_payment_order(
    dto: &CreatePurchasePaymentOrderDto,
) -> Result<(), DbError> {
    if dto.supplier_id <= 0 {
        return Err(DbError::Other(
            "Supplier ID must be a positive integer".to_string(),
        ));
    }

    if dto.status_id <= 0 {
        return Err(DbError::Other(
            "Status ID must be a positive integer".to_string(),
        ));
    }

    if let Some(employee_id) = dto.requested_by_employee_id {
        if employee_id <= 0 {
            return Err(DbError::Other(
                "Requested-by employee ID must be a positive integer".to_string(),
            ));
        }
    }

    if dto.details.is_empty() {
        return Err(DbError::Other(
            "Purchase payment order must contain at least one detail".to_string(),
        ));
    }

    let mut invoice_ids = std::collections::HashSet::new();

    for detail in &dto.details {
        if detail.purchase_invoice_id <= 0 {
            return Err(DbError::Other(
                "Purchase invoice ID must be a positive integer".to_string(),
            ));
        }

        if detail.amount_to_pay <= Decimal::ZERO {
            return Err(DbError::Other(
                "Amount to pay must be greater than zero".to_string(),
            ));
        }

        if !invoice_ids.insert(detail.purchase_invoice_id) {
            return Err(DbError::Other(format!(
                "Purchase invoice {} is duplicated in the payment order details",
                detail.purchase_invoice_id
            )));
        }
    }

    Ok(())
}