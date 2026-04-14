use crate::modules::quote::dto::response::QuoteResponseDto;
use crate::modules::quote::model::QuoteWithDetails;

// ------------------------------------------------------------
// Mapper layer
// This file converts internal domain models into public DTOs.
// It keeps transformation logic out of the service layer.
// ------------------------------------------------------------

pub fn quote_with_details_to_response(model: QuoteWithDetails) -> QuoteResponseDto {
    model.into()
}
