use axum::{
    routing::{get, post, patch},
    Router,
};

use crate::modules::quote::handler;
use crate::modules::auth::middleware::auth::protect_routes;

pub fn quote_router() -> Router {
    let protected = Router()::new()
        // GET /quotes -> list all quotes (or filtered)
        // POST /quotes -> create new quote
        .route("/quotes", get(handler::get_quotes).post(handler::create_quote))

        // GET /quotes/:id -> get quote by id
        // PATCH /quotes/:id -> update quote partially
        .route("/quotes/:id", get(handler::get_quote_by_id).patch(handler::patch_quote));
        

        // --------------------------------------------------------
        // Apply authentication middleware
        // This ensures all routes require valid auth token
        // --------------------------------------------------------
        protect_routes(protected)
}

