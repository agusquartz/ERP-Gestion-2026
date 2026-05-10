use axum::{routing::get, Router};
use crate::modules::purchase_invoice::handler;
use crate::modules::auth::middleware::auth::protect_routes;

pub fn purchase_invoice_router() -> Router {
	let protected = Router::new()
		.route("/purchases/purchase-invoices", get(handler::list_purchase_invoices));
	protect_routes(protected)
}