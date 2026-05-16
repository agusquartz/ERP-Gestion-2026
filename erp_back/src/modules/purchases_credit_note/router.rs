use axum::{
    routing::get, 
    Router
};

use crate::modules::{
    auth::middleware::auth::protect_routes, 
    purchase_order::handler::{
        list_credit_note,
        get_credit_note,
        create_credit_note,
    }
};

pub fn purchase_order_router() -> Router {
    let protected = Router::new()
        .route("/purchases/supplier-credit-notes", get(list_credit_note).post(create_credit_note))
        .route("/purchases/supplier-credit-notes/{id}", get(get_credit_note));
    protect_routes(protected)
}