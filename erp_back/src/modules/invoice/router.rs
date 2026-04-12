//! Invoice routes
//!
//! Defines HTTP endpoints for invoice operations and applies middleware.
//!
//! # Responsibilities
//! - Declare routes and HTTP methods
//! - Bind handlers to endpoints
//! - Apply authentication middleware
//!
//! # Endpoints
//! - GET    /invoices
//! - GET    /invoices/{id}
//! - POST   /invoices
//!
//! # Middleware
//! - All routes are protected via `protect_routes`
use axum::{
    routing::get, 
    Router
};

use crate::modules::{auth::middleware::auth::protect_routes, invoice::handler::{
    get_invoice,
    list_invoices, 
    create_invoice,
}
};

/// Builds the invoice router with protected routes.
pub fn invoice_router() -> Router {
    let protected = Router::new()
        .route("/invoices", get(list_invoices).post(create_invoice))
        .route("/invoices/{id}", get(get_invoice));
    protect_routes(protected)
}
