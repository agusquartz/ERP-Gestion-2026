// ============================================================
// MAPPER
// ============================================================

use crate::modules::purchase_request::dto::response::{
    PurchaseRequestDetailResponseDto,
    PurchaseRequestEmployeeResponseDto,
    PurchaseRequestProductResponseDto,
    PurchaseRequestResponseDto,
};

use crate::modules::purchase_request::dto::search::ProductSearchResponseDto;

use crate::modules::purchase_request::model::{
    ProductSearch,
    PurchaseRequestWithDetails,
};

pub fn purchase_request_to_response(
    data: PurchaseRequestWithDetails,
) -> PurchaseRequestResponseDto {
    PurchaseRequestResponseDto {
        id: data.purchase_request.id,
        created_at: data.purchase_request.created_at.to_string(),

        employee: PurchaseRequestEmployeeResponseDto {
            id: data.employee.id,
            name: data.employee.name,
            surname: data.employee.surname,
        },

        details: data
            .details
            .into_iter()
            .map(|detail| PurchaseRequestDetailResponseDto {
                id: detail.id,
                quantity: detail.quantity,

                product: PurchaseRequestProductResponseDto {
                    id: detail.product.id,
                    description: detail.product.description,
                    code: detail.product.code,
                },
            })
            .collect(),
    }
}

pub fn product_search_to_response(product: ProductSearch) -> ProductSearchResponseDto {
    ProductSearchResponseDto {
        id: product.id,
        description: product.description,
        code: product.code,
    }
}
