use axum::{
    routing::get, 
    Router};
    
use crate::modules::sales_reports::handler;

pub fn sales_router() -> Router {
    Router::new()
        // La URL final en el navegador quedará: /api/sales/reports?
        .route("/sales/reports", get(handler::get_sales_report))
}