use crate::modules::product;
use crate::modules::purchase_credit_note::{
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
/// 2. Transforms the incoming request DTO into the domain creation model (NewCreditNote).
/// 3. Persists the records and updates the inventory atomically through the repository layer.
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

    // 3. Persistence (The repository handles stock deduction within the transaction)
    let aggregate = repository::store_new_credit_note(new_cn).await?;
    
    // 4. Map domain aggregate to response DTO
    Ok(CreditNoteResponse::from(aggregate))
}