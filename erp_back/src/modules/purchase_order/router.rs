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

/// Constructs the router for purchase order endpoints.
///
/// This module defines all HTTP routes related to purchase orders
/// and applies authentication middleware to them.
///
/// Routes:
/// - GET    `/purchases/purchase_orders` → list purchase orders
/// - POST   `/purchases/purchase_orders` → create purchase order
/// - GET    `/purchases/purchase_orders/{id}` → fetch single purchase order
/// - PATCH  `/purchases/purchase_orders/{id}` → partially update purchase order
///
/// Security:
/// - All routes are wrapped with `protect_routes`, meaning authentication
///   is required for access.
///
/// Design notes:
/// - Routes are grouped under a shared `/purchases/purchase_orders` prefix
/// - Uses Axum router composition for modular feature separation
/// - Keeps handler wiring separate from business logic
pub fn purchase_order_router() -> Router {
    let protected = Router::new()
        .route("/purchases/purchase-orders", get(list_purchase_orders).post(create_purchase_order))
        .route("/purchases/purchase-orders/{id}", get(get_purchase_order).patch(patch_purchase_order));
    protect_routes(protected)
}
