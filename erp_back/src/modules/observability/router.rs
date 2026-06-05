use axum::{
    routing::get,
    Router,
};
use crate::modules::observability::handler::health;

pub fn observability_router() -> Router {
    Router::new()
        .route("/health", get(health))
}