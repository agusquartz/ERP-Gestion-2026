use crate::modules::product;
use crate::modules::purchases_credit_note::{
    repository,
    model::{
        new_credit_note_model::{NewCreditNote, NewCreditNoteDetail}
    },
    dto::{
        response::CreditNoteResponse,
        create::CreateCreditNoteDto,
    },
    errors,
};
use crate::shared::db_config;

/// Lists all supplier credit notes, optionally filtered by a search term.
pub async fn list_credit_notes(contains: Option<String>) -> Result<Vec<CreditNoteResponse>, errors::ServiceError> {
    
    let aggregates = repository::query_credit_notes(contains.as_deref()).await?;
    Ok(aggregates.into_iter().map(CreditNoteResponse::from).collect())
}

/// Retrieves a single supplier credit note by its identifier.
pub async fn get_credit_note(id: i32) -> Result<Option<CreditNoteResponse>, errors::ServiceError> {
    let aggregate = repository::query_credit_note_by_id(id).await?;
    Ok(aggregate.map(CreditNoteResponse::from))
}

/// Creates a new supplier credit note and deducts the corresponding inventory stock.
///
/// Business Logic:
/// 1. Validates that every referenced product in the details exists in the system.
/// 2. Transforms the incoming request DTO into the domain creation model.
/// 3. Opens a transaction at service level.
/// 4. Persists the credit note and deducts stock using the same transaction.
/// 5. Creates the automatic accounting entry using the same transaction.
/// 6. Commits if everything succeeds, otherwise rolls back.
pub async fn create_credit_note(dto: CreateCreditNoteDto) -> Result<CreditNoteResponse, errors::ServiceError> {
    // 1. Product existence validation
    for detail in &dto.details {
        product::service::get_product(detail.product_id)
            .await?
            .ok_or(errors::ServiceError::Validation(errors::ValidationError {
                context: format!("Product with ID {} not found", detail.product_id)
            }))?;
    }

    // 2. Map DTO to Domain Model
    let details: Vec<NewCreditNoteDetail> = dto.details
        .into_iter()
        .map(|d| NewCreditNoteDetail {
            product_id: d.product_id,
            quantity: d.quantity,
            unit_cost: d.unit_cost,
            subtotal: d.subtotal,
        })
        .collect();

    let new_cn = NewCreditNote {
        note_number: dto.note_number,
        return_note_id: dto.return_note_id,
        created_at: dto.created_at,
        total: dto.total,
        details,
    };

    // 3. Open transaction
    let mut client = db_config::get_client().await?;
    let tx = client
        .transaction()
        .await
        .map_err(db_config::DbError::from)?;

    let result: Result<i32, errors::ServiceError> = async {
        // 4. Persist credit note and deduct stock using the same transaction
        let return_credit_note_id = repository::store_new_credit_note_tx(
            &tx,
            new_cn,
        )
        .await?;

        // 5. Create automatic accounting entry using the same transaction
        crate::modules::accounting::service::post_purchase_return_credit_note_tx(
            &tx,
            return_credit_note_id,
        )
        .await?;

        Ok(return_credit_note_id)
    }
    .await;

    match result {
        Ok(return_credit_note_id) => {
            tx.commit()
                .await
                .map_err(db_config::DbError::from)?;

            // 6. Re-fetch the complete aggregate after commit
            let aggregate = repository::query_credit_note_by_id(return_credit_note_id)
                .await?
                .ok_or(db_config::DbError::InvariantViolation(
                    "Inserted credit note not found".into(),
                ))?;

            Ok(CreditNoteResponse::from(aggregate))
        }
        Err(e) => {
            let _ = tx.rollback().await;
            Err(e)
        }
    }
}