use rust_decimal::Decimal;

use crate::modules::return_notes::{
    dto::response::{
        ReturnNoteDetailResponseDto,
        ReturnNoteProductResponseDto,
        ReturnNoteResponseDto,
        ReturnNoteStatusResponseDto,
        ReturnNoteSupplierResponseDto,


    },
    model,
};

/// Maps a domain-level `ReturnNoteAggregate` into an API-facing
/// `ReturnNoteResponseDto`.
///
/// Responsibilities:
/// - Converts internal domain models into response DTOs.
/// - Maps nested status, detail and product data.
/// - Calculates the total amount from all return note details.
/// - Keeps the API response separated from the internal model.
///
/// Important:
/// - This function does not validate business rules.
/// - It only transforms data already loaded by the repository.
pub fn map_return_note(
    value: model::ReturnNoteAggregate,
) -> ReturnNoteResponseDto {
    let total = value
        .details
        .iter()
        .fold(Decimal::ZERO, |acc, detail| acc + detail.amount);

    ReturnNoteResponseDto {
        id: value.return_note.id,
        purchase_invoice_id: value.return_note.purchase_invoice_id,
        motive: value.return_note.motive,
        created_at: value.return_note.created_at,
        total,
        credit_note_id: value.return_note.credit_note_id,
        supplier: ReturnNoteSupplierResponseDto {
            id: value.supplier.id,
            name: value.supplier.name,
        },


        status: ReturnNoteStatusResponseDto {
            id: value.status.id,
            name: value.status.name,
        },
        details: value
            .details
            .into_iter()
            .map(map_return_note_detail)
            .collect(),
    }
}

/// Maps a return note detail aggregate into its response DTO.
fn map_return_note_detail(
    detail: model::ReturnNoteDetailAggregate,
) -> ReturnNoteDetailResponseDto {
    ReturnNoteDetailResponseDto {
        id: detail.id,
        product: ReturnNoteProductResponseDto {
            id: detail.product.id,
            code: detail.product.code,
            description: detail.product.description,
        },
        returned_quantity: detail.returned_quantity,
        amount: detail.amount,
    }
}