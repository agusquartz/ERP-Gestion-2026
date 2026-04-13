use axum::{
    routing::get, 
    Router
};

use crate::modules::{auth::middleware::auth::protect_routes, credit_notes::handler::{
    get_credit_note,
    list_credit_notes, 
    create_credit_note,
}
};

/// Builds the router with protected routes.
pub fn credit_note_router() -> Router {
    let protected = Router::new()
        .route("/credit-notes", get(list_credit_notes).post(create_credit_note))
        .route("/credit-notes/{id}", get(get_credit_note));
    protect_routes(protected)
}
