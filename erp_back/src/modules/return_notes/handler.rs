use axum::{
    Json, 
    extract::{Path, Query},
     http::StatusCode
};

use crate::modules::return_notes::{
    dto::{
        create::CreateReturnNoteDto, 
        query::ReturnNoteListQuery, 
        response::ReturnNoteResponseDto
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



pub async fn get_return_note_by_id(
    Path(id): Path<i32>,

) -> Result<Json<ReturnNoteResponseDto>, StatusCode>{
    println!("Llegó al handler get_return_note_by_id con id: {}", id);
    let result = service::get_return_note_by_id(id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    match result {
        Some(note) => Ok(Json(note)),
        None => Err(StatusCode::NOT_FOUND),
    }


}



pub async fn create_return_note(
    Json(payload): Json<CreateReturnNoteDto>,
) -> Result<Json<ReturnNoteResponseDto>, StatusCode> {
    let result = service::create_return_note(payload)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(result))
}



