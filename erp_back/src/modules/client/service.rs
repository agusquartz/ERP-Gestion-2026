// Orchestrates repository + mapper — does not touch SQL directly

use crate::modules::client::dto::create::CreateClientDto;
use crate::modules::client::dto::response::ClientResponseDto;
use crate::modules::client::dto::update::PatchClientDto;
use crate::modules::client::repository;
use crate::shared::db_config;

// This was added to unify error handling in the service layer
#[derive(Debug)]
pub enum ServiceError {
    Db(db_config::DbError),
    Validation(String),
}

// Convert DB errors automatically into ServiceError 
// This allows using `?` without manual mapping.
impl From<db_config::DbError> for ServiceError {
    fn from(value: db_config::DbError) -> Self {
        Self::Db(value)
    }
}   

//Display implementation for logs
impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::Db(_) => write!(f, "database error"), 
            ServiceError::Validation(msg) => write!(f, "validation error: {msg}"),
        }
    } 
}

impl std::error::Error for ServiceError {}

// GET /clients  y  GET /clients?contains=xxx
pub async fn get_clients(
    contains: Option<String>,
) -> Result<Vec<ClientResponseDto>, ServiceError> {
    let results = repository::query_clients(contains.as_deref()).await?;
    Ok(results.into_iter().map(Into::into).collect())
}

// GET /clients/{id}
pub async fn get_client_by_id(
    id: i32,
) -> Result<Option<ClientResponseDto>, ServiceError> {
    let result = repository::query_client_by_id(id).await?;
    Ok(result.map(Into::into))
}

// POST /clients
pub async fn create_client(
    dto: CreateClientDto,
) -> Result<ClientResponseDto, ServiceError> {
    let result = repository::insert_client(&dto).await?;
    Ok(Into::into(result))
}

// PATCH /clients/{id}
pub async fn patch_client(
    id: i32,
    dto: PatchClientDto,
) -> Result<Option<ClientResponseDto>, ServiceError> {
    let result = repository::patch_client(id, &dto).await?;
    Ok(result.map(Into::into))
}
