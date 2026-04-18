
//! # Quote Router
//!
//! Registers all HTTP routes for the `/quotes` resource and applies
//! authentication middleware to protect them.
//!
//! ## Route table
//!
//! | Method | Path          | Handler                     | Description                         |
//! |--------|---------------|-----------------------------|-------------------------------------|
//! | GET    | /quotes       | [`handler::list_quotes_handler`]  | List all quotes (optional filter)   |
//! | POST   | /quotes       | [`handler::create_quote_handler`] | Create a new quote                  |
//! | GET    | /quotes/{id}  | [`handler::get_quote_handler`]    | Get a single quote by ID            |
//!
//! ## Authentication
//! All routes are wrapped with [`protect_routes`], which adds an Axum middleware
//! layer that validates the request's JWT / session token before any handler runs.
//! Unauthenticated requests are rejected with `401 Unauthorized` at the middleware
//! level — they never reach the handler functions.
//!
//! ## Note: no PATCH route
//! A `PatchQuoteDto` exists in `dto/update.rs` but no PATCH handler or route is
//! registered yet. This router should be updated when that endpoint is implemented.
//!
//! ## Integration
//! The router returned by [`quote_router`] is merged into the application's main
//! router (typically in `main.rs`) using `Router::merge`.

use axum::{Router, routing::{get, post}};

use crate::modules::quote::handler;
use crate::modules::auth::middleware::auth::protect_routes;

/// Builds and returns the [`Router`] for all `/quotes` endpoints.
///
/// Uses Axum's method chaining to attach multiple HTTP methods to the same
/// URL pattern. All routes are protected by authentication middleware via
/// [`protect_routes`].
///
/// # Returns
/// An Axum [`Router`] ready to be merged into the application's main router.
///
/// # Example (in main router setup)
/// ```rust
/// let app = Router::new()
///     .merge(quote_router())
///     .merge(client_router());
/// ```

pub fn quote_router() -> Router {
    let protected = Router::new()
        // GET  /quotes  → list all quotes (supports ?contains= filter)
        // POST /quotes  → create a new quote
        .route("/quotes", get(handler::list_quotes_handler).post(handler::create_quote_handler))
        
        // GET /quotes/{id} → retrieve a single quote with all its line items
        .route("/quotes/{id}", get(handler::get_quote_handler));
    
    // Wrap all routes with authentication middleware.
    // Requests without a valid token are rejected before reaching any handler.
    protect_routes(protected)
}
