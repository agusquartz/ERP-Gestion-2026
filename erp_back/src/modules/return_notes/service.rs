use crate::{
    modules::return_notes::{
        dto::{
            query::ReturnNoteListQuery,
            response::ReturnNoteResponseDto,
        },
        mapper,
        repository,
    },
    shared::db_config,
};

pub async fn list_return_notes(
    query: ReturnNoteListQuery,
) -> Result<Vec<ReturnNoteResponseDto>, db_config::DbError> {
    let aggregates = repository::query_return_notes( query)
    .await?;

    let response = aggregates
        .into_iter()
        .map(mapper::map_return_note)
        .collect();

    Ok(response)
}