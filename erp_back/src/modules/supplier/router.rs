use axum::{
    routing::get,
    Router,
};

use crate::modules::{
    auth::middleware::auth::protect_routes,
    supplier::handler::{
        get_supplier,
        list_categories,
        list_supplier_categories,
        list_suppliers,
    },
};

/// Creates a router for supplier-related routes.
///
/// All routes are protected by authentication middleware.
///
/// # Routes
/// - `GET /suppliers`
/// - `GET /suppliers?contains=...`
/// - `GET /suppliers?categories=1&categories=2`
/// - `GET /suppliers/{id}`
/// - `GET /suppliers/{id}/categories`
/// - `GET /categories`
pub fn supplier_router() -> Router {
    let protected = Router::new()
        .route("/suppliers", get(list_suppliers))
        .route("/suppliers/{id}", get(get_supplier))
        .route("/suppliers/{id}/categories", get(list_supplier_categories))
        .route("/categories", get(list_categories));

    protect_routes(protected)
}