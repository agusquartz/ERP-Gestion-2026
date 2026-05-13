//! router.rs — purchase_request module
//!
//! Defines all HTTP routes and binds them to their handlers.
//!
//! To register this router in main.rs:
//!
//!   // In the modules mod block:
//!   pub mod purchase_request;
//!
//!   // In the router chain:
//!   .merge(modules::purchase_request::router::purchase_request_router())
//!
//! Routes:
//!   POST  /purchase-requests              → create_purchase_request
//!   GET   /purchase-requests/:id          → get_purchase_request
//!   POST  /purchase-quotes                → create_purchase_quote
//!   PATCH /purchase-quotes/:id            → patch_purchase_quote
//!   POST  /purchase-quotes/:id/details    → save_quote_details

use axum::{
    routing::{get, post},
    Router,
};

use crate::modules::auth::middleware::auth::protect_routes;

/// Builds and returns the Axum router for the purchase_request module.
///
/// Called once at application startup in main.rs.
/// All routes are relative to the application root.
pub fn purchase_request_router() -> Router {
    Router::new()
        .route( "/purchases/purchase-requests", 
            post(handler::create_purchase_request).get(handler::list_purchase_requests)
        )
        // Full purchase request payload for the "View Purchase Order" page
        .route(
            "/purchase-requests",
            post(create_purchase_request_handler)
                .get(list_purchase_requests_handler),
        );
    protect_routes(protect)
      
}
