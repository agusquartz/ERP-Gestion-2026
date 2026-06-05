use axum::{
    routing::get,
    Router,
};

use crate::modules::return_notes::handler;

pub fn routes() -> Router {
    Router::new()
        .route("/return-notes",get(handler::list_return_notes).post(handler::create_return_note))
        .route("/return-notes/{id}", get(handler::get_return_note_by_id))
        .route("/return-notes/by-invoice/{id}", get(handler::get_return_notes_by_invoice_id))
}
