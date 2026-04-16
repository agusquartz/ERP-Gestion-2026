//! # Client Router
//!
//! Registers all HTTP routes for the `/clients` resource and applies
//! authentication middleware to protect them.
//!
//! ## Route table
//!
//! | Method | Path             | Handler                        | Description                        |
//! |--------|------------------|--------------------------------|------------------------------------|
//! | GET    | /clients         | [`handler::get_clients`]       | List all clients (optional filter) |
//! | POST   | /clients         | [`handler::create_client`]     | Create a new client                |
//! | GET    | /clients/{id}    | [`handler::get_client_by_id`]  | Get one client by id               |
//! | PATCH  | /clients/{id}    | [`handler::patch_client`]      | Partially update a client          |
//!
//! ## Authentication
//! All routes are wrapped with [`protect_routes`], which adds an Axum middleware
//! layer that validates the request's JWT / session token before any handler runs.
//! Unauthenticated requests are rejected with `401 Unauthorized` at the middleware
//! level — they never reach the handler functions.
//!
//! ## Integration
//! The router returned by [`client_router`] is merged into the application's main
//! router (typically in `main.rs` or a top-level `app_router` function) using
//! `Router::merge`.

use axum::{
    routing::get,
    Router,
};

use crate::modules::client::handler;
use crate::modules::auth::middleware::auth::protect_routes;

/// Builds and returns the `Router` for all `/clients` endpoints.
///
/// Uses Axum's method chaining on a single `route()` call per path to attach
/// multiple HTTP methods to the same URL pattern without repetition.
///
/// The entire router is passed through [`protect_routes`], which wraps it with
/// authentication middleware. This ensures every route defined here requires
/// a valid authenticated session.
///
/// # Returns
/// An Axum [`Router`] ready to be merged into the application's main router.
///
/// # Example (in main router setup)
/// ```rust
/// let app = Router::new()
///     .merge(client_router())
///     .merge(other_module_router());
/// ```

pub fn client_router() -> Router {
   let protected =  Router::new()
        // GET /clients          → list all (or filtered)
        // POST /clients         → create new client
        .route("/clients", get(handler::get_clients).post(handler::create_client))  
        
        // GET /clients/{id}     → get single client
        // PATCH /clients/{id}   → partial update
        .route("/clients/{id}", get(handler::get_client_by_id).patch(handler::patch_client));

    // Wraps all routes with the auth middleware.
    // Any request missing or carrying an invalid token is rejected here.
    protect_routes(protected)
}
