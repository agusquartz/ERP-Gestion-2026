use axum::{
    routing::{get, patch},
    Router,
};

use crate::modules::{auth::middleware::auth::protect_routes, product::handler::{
    get_product,
    list_products,
    patch_product,
}};

/// Creates a router for product-related routes.
///
/// # Routes
/// - `GET /products`
/// - `GET /products?contains=...`
/// - `GET /products/{id}`
/// - `PATCH /products/{id}`
pub fn product_router() -> Router {
    let protected =  Router::new()
        .route("/products", get(list_products))
        .route("/products/:id", get(get_product).patch(patch_product));

    protect_routes(protected)
}