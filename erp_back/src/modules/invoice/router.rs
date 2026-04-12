use axum::{
    routing::get, 
    Router
};

use crate::modules::{auth::middleware::auth::protect_routes, invoice::handler::{
    get_invoice,
    list_invoices, 
    create_invoice,
}
};

pub fn invoice_router() -> Router {
    let protected = Router::new()
        .route("/invoices", get(list_invoices).post(create_invoice))
        .route("/invoices/{id}", get(get_invoice));
    protect_routes(protected)
}
