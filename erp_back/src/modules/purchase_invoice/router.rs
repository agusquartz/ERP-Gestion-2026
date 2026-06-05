use axum::{routing::{get, post}, Router};

use crate::modules::{
    auth::middleware::auth::protect_routes,
    purchase_invoice::handler::{
        list_purchase_invoices,
        get_purchase_invoice,
        create_purchase_invoice,
        get_purchase_invoices_by_order_id,
    },
};


/// Constructs the router for purchase invoice endpoints.
///
/// Mirrors `purchase_order_router` — same structure, same auth middleware.
///
/// Routes:
/// - GET  /purchases/purchase-invoices       → list purchase invoices (with optional ?contains=)
/// - POST /purchases/purchase-invoices       → create purchase invoice
/// - GET  /purchases/purchase-invoices/{id} → fetch single invoice with line items
///
/// All routes are protected by `protect_routes` (authentication required).
pub fn purchase_invoice_router() -> Router {
    let protected = Router::new()
        .route(
            "/purchases/purchase-invoices",
            get(list_purchase_invoices).post(create_purchase_invoice),
        )
        .route(
            "/purchases/purchase-invoices/{id}",
            get(get_purchase_invoice),
        )
        .route(
            "/purchases/purchase-invoices/by-order/{id}",
            get(get_purchase_invoices_by_order_id)
        );
    protect_routes(protected)
}
