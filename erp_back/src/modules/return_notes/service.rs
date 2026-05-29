use chrono::Utc;

use crate::{
    modules::return_notes::{
        dto::{
            query::ReturnNoteListQuery,
            response::ReturnNoteResponseDto,
            create::CreateReturnNoteDto
        },
        mapper,
        repository,
        model
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





pub async fn create_return_note(
    payload: CreateReturnNoteDto,
) -> Result<ReturnNoteResponseDto, db_config::DbError> {
    let created_at = payload
        .created_at
        .unwrap_or_else(|| Utc::now().date_naive());
    println!("antes de status query");
    let status_id = repository::get_status_id_by_name("CREATED").await?;
    println!("Found status_id: {}", status_id);
    let new_note = model::NewReturnNote {
        purchase_invoice_id: payload.purchase_invoice_id,
        motive: payload.motive,
        created_at,
        status_id,
        details: payload
            .details
            .into_iter()
            .map(|detail| model::NewReturnNoteDetail {
                product_id: detail.product_id,
                returned_quantity: detail.returned_quantity,
                amount: detail.amount,
            })
            .collect(),
    };

    let aggregate = repository::store_new_return_note(new_note).await?;

    Ok(mapper::map_return_note(aggregate))
}

