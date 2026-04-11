use axum::{
    routing::get,
    Router,
};

use crate::modules::client::handler;
use crate::modules::auth::middleware::auth::protect_routes;

pub fn client_router() -> Router {
   let protected =  Router::new()
        .route("/clients", get(handler::get_clients).post(handler::create_client))  
        .route("/clients/:id", get(handler::get_client_by_id).patch(handler::patch_client));

    protect_routes(protected)
}
