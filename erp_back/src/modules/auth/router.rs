use axum::{
    routing::{get, post},
    Router,
};
use crate::modules::auth::handler::{login, logout, whoami};
use crate::modules::auth::middleware::auth::protect_routes;

/// Creates a router for authentication-related routes.
///
/// # Routes
/// - `POST /auth/login` → login handler
/// - `POST /auth/logout` → logout handler
/// - `GET /auth/whoami` → returns the authenticated user's claims
pub fn auth_router() -> Router {
    // Public routes (without middleware)
    let public = Router::new()
        .route("/auth/login", post(login));

    // Protected routes (with middleware)
    let protected = Router::new()
        .route("/auth/logout", post(logout))
        .route("/auth/whoami", get(whoami));

    // Protect and Merge
    public.merge(protect_routes(protected))
}