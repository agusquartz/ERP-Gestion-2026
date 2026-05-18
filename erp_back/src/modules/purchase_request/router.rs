
use axum::{
    routing::{get, post},
    Router,
};

use crate::modules::auth::middleware::auth::protect_routes;

use crate::modules::purchase_request::handler::{
    create_purchase_request_handler,
    get_purchase_request_handler,
    list_purchase_requests_handler,
    list_products_for_purchase_request_handler,
};

pub fn list_purchase_request_router() -> Router {
    let protect = Router::new()
        .route(
            "/purchase-requests", get(list_purchase_requests_handler).post(create_purchase_request_handler)
        );
    protect_routes(protect)
      
}