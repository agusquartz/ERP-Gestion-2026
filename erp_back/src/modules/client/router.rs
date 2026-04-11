use axum::{
    routing::{get, post, patch},
    Router,
};

use crate::modules::client::handler;

pub fn router() -> Router {
    Router::new()
        // /clients
        .route(
            "/clients",
            get(handler::get_clients)
                .post(handler::create_client),
        )
        // /clients/{id}
        .route(
            "/clients/:id",
            get(handler::get_client_by_id)
                .patch(handler::patch_client),
        )
}
