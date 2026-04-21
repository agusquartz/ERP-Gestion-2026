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
/// All routes are protected by authentication middleware.
///
/// # Routes
/// - `GET /products` → list all products
/// - `GET /products?contains=...` → filtered search
/// - `GET /products/:id` → get product by ID
/// - `PATCH /products/:id` → partially update product
pub fn product_router() -> Router {
    let protected =  Router::new()
        .route("/products", get(list_products))
        .route("/products/{id}", get(get_product).patch(patch_product));

    protect_routes(protected)
}
