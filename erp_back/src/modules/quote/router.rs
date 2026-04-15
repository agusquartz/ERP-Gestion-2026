use axum::{Router, routing::{get, post}};

use crate::modules::quote::handler;
use crate::modules::auth::middleware::auth::protect_routes;

/// Quote routes
pub fn quote_router() -> Router {
    let protected = Router::new()
        .route("/quotes", get(handler::list_quotes_handler).post(handler::create_quote_handler))
        .route("/quotes/{id}", get(handler::get_quote_handler));
    
    protect_routes(protected)
}
