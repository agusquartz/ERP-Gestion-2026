// use chrono::Utc;

// use crate::{
//     modules::return_notes::{
//         dto::{
//             create::CreateReturnNoteDto, query::ReturnNoteListQuery, response::{ListReturnNoteView, ReturnNoteResponseDto}
//         }, mapper, model, repository
//     },
//     shared::db_config,
// };

// pub async fn list_return_notes(
//     mut query: ReturnNoteListQuery,
// ) -> Result<ListReturnNoteView, db_config::DbError> {
//     let limit = query.limit as usize;
//     query.limit += 1;

//     let aggregates = repository::query_return_notes( query)
//     .await?;

//     let response = aggregates
//         .into_iter()
//         .map(mapper::map_return_note)
//         .collect();

//     Ok(response)
// }



// pub async fn get_return_note_by_id(
//     id: i32,
// ) -> Result<Option<ReturnNoteResponseDto>, db_config::DbError> {
//     let aggregate = repository::query_return_note_by_id(id).await?;

//     Ok(aggregate.map(mapper::map_return_note))
// }





// pub async fn create_return_note(
//     payload: CreateReturnNoteDto,
// ) -> Result<ReturnNoteResponseDto, db_config::DbError> {
//     let created_at = payload
//         .created_at
//         .unwrap_or_else(|| Utc::now().date_naive());
//     println!("antes de status query");
//     let status_id = repository::get_status_id_by_name("CREATED").await?;
//     println!("Found status_id: {}", status_id);
//     let new_note = model::NewReturnNote {
//         purchase_invoice_id: payload.purchase_invoice_id,
//         motive: payload.motive,
//         created_at,
//         status_id,
//         details: payload
//             .details
//             .into_iter()
//             .map(|detail| model::NewReturnNoteDetail {
//                 product_id: detail.product_id,
//                 returned_quantity: detail.returned_quantity,
//                 amount: detail.amount,
//             })
//             .collect(),
//     };

//     let aggregate = repository::store_new_return_note(new_note).await?;

//     Ok(mapper::map_return_note(aggregate))
// }

use chrono::Utc;

use crate::{
    modules::return_notes::{
        dto::{
            create::CreateReturnNoteDto,
            query::ReturnNoteListQuery,
            response::{
                ListReturnNoteView,
                ReturnNoteResponseDto,
            },
        },
        mapper,
        model,
        repository,
    },
    shared::db_config,
};

pub async fn list_return_notes(
    mut query: ReturnNoteListQuery,
) -> Result<ListReturnNoteView, db_config::DbError> {
    let limit = query.limit as usize;

    // Pedimos 1 registro extra para saber si existe una siguiente página.
    query.limit += 1;

    let aggregates = repository::query_return_notes(query).await?;

    let mut return_notes: Vec<ReturnNoteResponseDto> = aggregates
        .into_iter()
        .map(mapper::map_return_note)
        .collect();

    let has_more = return_notes.len() > limit;

    return_notes.truncate(limit);

    Ok(ListReturnNoteView {
        return_notes,
        has_more,
    })
}

pub async fn get_return_notes_by_invoice_id(
    invoice_id: i32,
) -> Result<Option<Vec<ReturnNoteResponseDto>>, db_config::DbError> {
    let maybe_notes: Option<Vec<model::ReturnNoteAggregate>> = repository::query_return_notes_by_invoice_id(invoice_id).await?;

    let response: Option<Vec<ReturnNoteResponseDto>> = maybe_notes.map(|notes|{ notes
        .into_iter()
        .map(mapper::map_return_note).collect()
        });

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