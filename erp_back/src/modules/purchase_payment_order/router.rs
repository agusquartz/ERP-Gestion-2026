//! # Purchase Payment Order Router
//!
//! Registers all HTTP routes for the `/purchase-payment-orders` resource and
//! applies authentication middleware to protect them.
//!
//! ## Route table
//!
//! | Method | Path                                  | Handler                                                | Description                         |
//! |--------|---------------------------------------|--------------------------------------------------------|-------------------------------------|
//! | GET    | /purchase-payment-orders              | `list_purchase_payment_orders_handler`                 | List all payment orders             |
//! | POST   | /purchase-payment-orders              | `create_purchase_payment_order_handler`                | Create a new payment order          |
//! | GET    | /purchase-payment-orders/{id}         | `get_purchase_payment_order_handler`                   | Get payment order by ID             |
//! | PATCH  | /purchase-payment-orders/{id}/status  | `update_purchase_payment_order_status_handler`         | Update payment order status         |
//! | PATCH  | /purchase-payment-orders/{id}/approve | `approve_purchase_payment_order_handler`               | Approve payment order               |
//!
//! ## Authentication
//! All routes are wrapped with [`protect_routes`], which validates the request
//! before it reaches any handler.

use axum::{
    Router,
    routing::{get, patch},
};

use crate::modules::auth::middleware::auth::protect_routes;
use crate::modules::purchase_payment_order::handler;

/// Builds and returns the [`Router`] for all purchase payment order endpoints.
///
/// # Example
/// ```rust
/// let app = Router::new()
///     .merge(purchase_payment_order_router());
/// ```
pub fn purchase_payment_order_router() -> Router {
    let protected = Router::new()
        // GET  /purchase-payment-orders
        // POST /purchase-payment-orders
        .route(
            "/purchase-payment-orders",
            get(handler::list_purchase_payment_orders_handler)
                .post(handler::create_purchase_payment_order_handler),
        )

        // GET /purchase-payment-orders/{id}
        .route(
            "/purchase-payment-orders/{id}",
            get(handler::get_purchase_payment_order_handler),
        )

        // PATCH /purchase-payment-orders/{id}/status
        .route(
            "/purchase-payment-orders/{id}/status",
            patch(handler::update_purchase_payment_order_status_handler),
        )

        // PATCH /purchase-payment-orders/{id}/approve
        .route(
            "/purchase-payment-orders/{id}/approve",
            patch(handler::approve_purchase_payment_order_handler),
        );

    protect_routes(protected)
}