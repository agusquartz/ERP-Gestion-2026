// Orchestrates repository + mapper — does not touch SQL directly

use crate::modules::client::dto::create::CreateClientDto;
use crate::modules::client::dto::response::ClientResponseDto;
use crate::modules::client::dto::update::PatchClientDto;
use crate::modules::client::repository;
use crate::shared::db_config;

// GET /clients  y  GET /clients?contains=xxx
pub async fn get_clients(
    contains: Option<String>,
) -> Result<Vec<ClientResponseDto>, db_config::DbError> {
    let results = repository::query_clients(contains.as_deref()).await?;
    Ok(results.into_iter().map(Into::into).collect())
}

// GET /clients/{id}
pub async fn get_client_by_id(
    id: i32,
) -> Result<Option<ClientResponseDto>, db_config::DbError> {
    let result = repository::query_client_by_id(id).await?;
    Ok(result.map(Into::into))
}

// POST /clients
pub async fn create_client(
    dto: CreateClientDto,
) -> Result<ClientResponseDto, db_config::DbError> {
    let result = repository::insert_client(&dto).await?;
    Ok(Into::into(result))
}

// PATCH /clients/{id}
pub async fn patch_client(
    id: i32,
    dto: PatchClientDto,
) -> Result<Option<ClientResponseDto>, db_config::DbError> {
    let result = repository::patch_client(id, &dto).await?;
    Ok(result.map(Into::into))
}
