use axum::{
    extract::Query,
    http::StatusCode,
    Json,
};

use crate::modules::return_notes::{
    dto::{
        query::ReturnNoteListQuery,
        response::ReturnNoteResponseDto,
    },
    service,
};

pub async fn list_return_notes(
    Query(query): Query<ReturnNoteListQuery>,
) -> Result<Json<Vec<ReturnNoteResponseDto>>, StatusCode> {
    let result = service::list_return_notes(query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(result))
}