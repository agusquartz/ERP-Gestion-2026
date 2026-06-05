
use axum::{
    routing::{ 
        get,
        post,
        delete,
    },
    Router,
};

use crate::modules::employee::handler;
use crate::modules::auth::middleware::auth::protect_routes;

pub fn employee_router() -> Router {
    let protected =  Router::new()
        .route("/hr/employees", get(handler::get_employees).post(handler::create_employee))  
        .route("/hr/employees/{id}", get(handler::get_employee_by_id))
        .route("/hr/payroll", get(handler::get_payroll_processes))
        .route("/hr/payroll/calculate", post(handler::run_monthly_payroll))
        .route("/hr/payroll/{id}/status", post(handler::update_payroll_status))
        .route("/hr/payroll/{process_id}/receipts", get(handler::get_historical_payroll));
    // Wraps all routes with the auth middleware.
    // Any request missing or carrying an invalid token is rejected here.
    protect_routes(protected)
}
