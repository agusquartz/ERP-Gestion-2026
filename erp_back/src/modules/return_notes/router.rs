use axum::{
    routing::get,
    Router,
};

use crate::modules::return_notes::handler;

pub fn routes() -> Router {
    Router::new()
        .route("/return-notes", get(handler::list_return_notes))

    // protect_routes()
}