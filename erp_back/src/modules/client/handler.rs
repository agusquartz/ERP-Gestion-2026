use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;

use crate::modules::client::dto::create::CreateClientDto;
use crate::modules::client::dto::update::PatchClientDto;
use crate::modules::client::service;
use crate::shared::db_config::DbState;

// Struct para ?contains=xxx
// Option because the query param is optional — without it returns all
#[derive(Deserialize)]
pub struct ClientQuery {
    pub contains: Option<String>,
}

// GET /clients  y  GET /clients?contains=xxx
// Single handler covers both cases
pub async fn get_clients(
    State(_state): State<DbState>,
    Query(params): Query<ClientQuery>,
) -> impl IntoResponse {
    match service::get_clients(params.contains).await {
        Ok(clients) => (StatusCode::OK, Json(clients)).into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

// GET /clients/{id}
pub async fn get_client_by_id(
    State(_state): State<DbState>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    match service::get_client_by_id(id).await {
        Ok(Some(client)) => (StatusCode::OK, Json(client)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

// POST /clients
pub async fn create_client(
    State(_state): State<DbState>,
    Json(dto): Json<CreateClientDto>,
) -> impl IntoResponse {
    match service::create_client(dto).await {
        Ok(client) => (StatusCode::CREATED, Json(client)).into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

// PATCH /clients/{id}
pub async fn patch_client(
    State(_state): State<DbState>,
    Path(id): Path<i32>,
    Json(dto): Json<PatchClientDto>,
) -> impl IntoResponse {
    match service::patch_client(id, dto).await {
        Ok(Some(client)) => (StatusCode::OK, Json(client)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}
