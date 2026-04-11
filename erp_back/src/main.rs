
use axum::{
    Router,
};
use dotenvy::from_filename;
use tower_cookies::CookieManagerLayer;
use tower_http::cors::{CorsLayer};
use axum::http::{Method, header, HeaderName};
use axum::http::HeaderValue;
use axum::serve;
use tokio::net::TcpListener;
use std::net::SocketAddr;
use shared::db_config;

mod modules {
    pub mod auth;
    pub mod observability;
    pub mod user;
    pub mod client;
    pub mod product;
    pub mod client;
    pub mod product;
    pub mod client;
}

mod shared {
    pub mod config;
    pub mod db_config;
    pub mod errors;
}

pub mod utils {
    pub mod argon2;
}


#[tokio::main]
async fn main() {
    
    // -------------------------------------------------------------------------
    // LOAD ENVIRONMENT VARIABLES
    // -------------------------------------------------------------------------
    let mut path = dirs::config_dir()
        .ok_or("Cannot find configuration directory").unwrap();

    path.push("ERP-Gestion-2026/.env");

    from_filename(&path)
        .ok()
        .expect("Failed to load environment variables from .env file");

    //dotenv().ok();
    
    //DATABASE CONFIGURATION
    //-------------------------------------------------------------------------
    //TODO: error management
    let db_params = db_config::DbParams {
        host: std::env::var("DB_HOST").unwrap(),
        port: std::env::var("DB_PORT").unwrap().parse().unwrap(),
        user: std::env::var("DB_USER").unwrap(),
        password: std::env::var("DB_PASSWORD").unwrap(),
        db_name: Some(std::env::var("DB_NAME").unwrap()),
        pool_max_size: std::env::var("DB_POOL_SIZE").unwrap().parse().unwrap(),
    };

    // FORCE INITIALIZATION
    db_config::init_global_pool(db_params).await.unwrap();
    let _ = &*crate::shared::config::CONFIG;


    // -------------------------------------------------------------------------
    // CORS CONFIGURATION
    // -------------------------------------------------------------------------
    let cors_origin = std::env::var("CORS_ALLOWED_ORIGIN")
        .expect("CORS_ALLOWED_ORIGIN must be set");

    let cors = CorsLayer::new()
        .allow_origin(cors_origin.parse::<HeaderValue>().unwrap())
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
        ])
        .allow_headers([
            header::CONTENT_TYPE,
            HeaderName::from_static("x-csrf-token"),
        ])
        .allow_credentials(true);


    // -------------------------------------------------------------------------
    // ROUTES
    // -------------------------------------------------------------------------

    let app = Router::new()
        .merge(modules::observability::router::observability_router())
        .merge(modules::auth::router::auth_router())
        .merge(modules::client::router::client_router())
        .merge(modules::product::router::product_router())
        .merge(modules::client::router::client_router())
        .merge(modules::product::router::product_router())
        .merge(modules::client::router::router())
        .layer(CookieManagerLayer::new())
        .layer(cors);


    // -------------------------------------------------------------------------
    // START THE SERVER
    // -------------------------------------------------------------------------
    let host = std::env::var("SERVER_HOST")
        .expect("SERVER_HOST must be set");

    let port: u16 = std::env::var("SERVER_PORT")
        .expect("SERVER_PORT must be set")
        .parse()
        .expect("SERVER_PORT must be a valid number");

    let addr: SocketAddr = format!("{}:{}", host, port)
        .parse()
        .expect("Invalid server address");

    let listener = TcpListener::bind(addr)
        .await
        .expect("Failed to bind address");

    serve(listener, app)
        .await
        .unwrap();
}
