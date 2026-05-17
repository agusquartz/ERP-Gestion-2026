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

/// Lista todas las notas de crédito, con filtro opcional.
pub async fn list_credit_notes(contains: Option<String>) -> Result<Vec<CreditNoteResponse>, errors::ServiceError> {
    let aggregates = repository::query_credit_notes(contains.as_deref()).await?;
    Ok(aggregates.into_iter().map(CreditNoteResponse::from).collect())
}

/// Obtiene una nota de crédito específica por su ID.
pub async fn get_credit_note(id: i32) -> Result<Option<CreditNoteResponse>, errors::ServiceError> {
    let aggregate = repository::query_credit_note_by_id(id).await?;
    Ok(aggregate.map(CreditNoteResponse::from))
}

/// Crea una nueva nota de crédito de compra y descuenta el stock correspondiente.
/// 
/// Lógica de Negocio:
/// 1. Valida que cada producto en los detalles exista en el sistema.
/// 2. Transforma el DTO de entrada al modelo de dominio (NewCreditNote).
/// 3. Persiste los datos y actualiza el inventario de manera atómica a través del repository.
pub async fn create_credit_note(dto: CreateCreditNoteDto) -> Result<CreditNoteResponse, errors::ServiceError> {
    // 1. Validación de existencia de productos
    for detail in &dto.details {
        product::service::get_product(detail.product_id)
            .await?
            .ok_or(errors::ServiceError::Validation(errors::ValidationError {
                context: format!("Product with ID {} not found", detail.product_id)
            }))?;
    }

    // 2. Transformación de DTO a Modelo de Dominio
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

    // 3. Persistencia (El repositorio ahora maneja el descuento de stock dentro de la TX)
    let aggregate = repository::store_new_credit_note(new_cn).await?;
    
    // 4. Mapeo a respuesta
    Ok(CreditNoteResponse::from(aggregate))
}