use axum::{
    routing::{get, post},
    Router,
};

use crate::modules::purchase_request::handler;
use crate::modules::auth::middleware::auth::protect_routes;

/// Builds the router for purchase request and quote related endpoints.
///
/// This router exposes:
/// - Purchase request creation and listing
/// - Retrieval of a full purchase request aggregate
/// - Creation of quotes linked to a purchase request
/// - Partial updates to quotes (status + lifecycle fields)
pub fn purchase_request_router() -> Router {
    let protect = Router::new()
        .route( "/purchases/purchase-requests", 
            get(handler::list_purchase_requests)
            .post(handler::create_purchase_request)
        )
        .route("/purchases/purchase-requests/{id}",
            get(handler::get_purchase_request)
            .post(handler::create_purchase_quote)
            .patch(handler::patch_purchase_quote),
        );
        protect_routes(protect)
}
