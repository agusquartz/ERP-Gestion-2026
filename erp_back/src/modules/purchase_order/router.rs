use axum::{
    routing::get, 
    Router
};

use crate::modules::{
    auth::middleware::auth::protect_routes, 
    purchase_order::handler::{
        list_purchase_orders,
        get_purchase_order,
        create_purchase_order,
        patch_purchase_order
    }
};

/// Builds the invoice router with protected routes.
pub fn purchase_order_router() -> Router {
    let protected = Router::new()
        .route("/purchases/purchase_orders", get(list_purchase_orders).post(create_purchase_order))
        .route("/purchases/purchase_orders/{id}", get(get_purchase_order).patch(patch_purchase_order));
    protect_routes(protected)
}
