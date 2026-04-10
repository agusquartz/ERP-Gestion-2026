// Orchestrates repository + mapper — does not touch SQL directly

use rust_decimal::Decimal;

use crate::modules::client::dto::create::CreateClientDto;
use crate::modules::client::dto::response::{ClientResponseDto, PhoneResponseDto};
use crate::modules::client::dto::update::PatchClientDto;
use crate::modules::client::model::ClientAggregate;
use crate::modules::client::repository;
use crate::shared::db_config;

// Converts the internal aggregate into the response DTO
fn to_response(agg: ClientAggregate) -> ClientResponseDto {
    ClientResponseDto {
        id: agg.client.id,
        name: agg.client.name,
        surname: agg.client.surname,
        ruc: agg.client.ruc,
        address: agg.client.address,
        email: agg.client.email,
        birth_date: agg.client.birth_date,
        current_credit: agg.client.curr_credit, // DB: curr_credit → DTO: current_credit
        credit_limit: agg.client.credit_limit,
        phones: agg.phones
            .into_iter()
            .map(|p| PhoneResponseDto {
                id: p.id,
                phone_number: p.phone_number,
                is_emergency: p.is_emergency,
            })
            .collect(),
    }
}

// GET /clients  y  GET /clients?contains=xxx
pub async fn get_clients(
    contains: Option<String>,
) -> Result<Vec<ClientResponseDto>, db_config::DbError> {
    let results = repository::query_clients(contains.as_deref()).await?;
    Ok(results.into_iter().map(to_response).collect())
}

// GET /clients/{id}
pub async fn get_client_by_id(
    id: i32,
) -> Result<Option<ClientResponseDto>, db_config::DbError> {
    let result = repository::query_client_by_id(id).await?;
    Ok(result.map(to_response))
}

// POST /clients
pub async fn create_client(
    dto: CreateClientDto,
) -> Result<ClientResponseDto, db_config::DbError> {
    let result = repository::insert_client(&dto).await?;
    Ok(to_response(result))
}

// PATCH /clients/{id}
pub async fn patch_client(
    id: i32,
    dto: PatchClientDto,
) -> Result<Option<ClientResponseDto>, db_config::DbError> {
    let result = repository::patch_client(id, &dto).await?;
    Ok(result.map(to_response))
}
