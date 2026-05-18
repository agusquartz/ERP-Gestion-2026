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



pub async fn get_return_note_by_id(
    id: i32,
) -> Result<Option<ReturnNoteResponseDto>, db_config::DbError> {
    let aggregate = repository::query_return_note_by_id(id).await?;

    Ok(aggregate.map(mapper::map_return_note))
}