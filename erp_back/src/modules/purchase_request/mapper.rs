// ============================================================
// MAPPER
// ============================================================

use crate::modules::purchase_request::{
    dto::{
        response::{
            PurchaseRequestResponse,
            PurchaseRequestItemsResponse,
            PurchaseQuoteResponse,
            PurchaseQuoteDetailResponse,
            CreatePurchaseQuoteResponse,
            UpdatePurchaseQuoteResponse,
            SaveQuoteDetailsResponse,
        },
        create::{
            CreatePurchaseRequestDto,
            CreatePurchaseRequestDtoLine,
        },
    },
    model::{
        NewPurchaseRequest,
        NewPurchaseRequestLine,
        NewQuoteAggregate,
        PatchedQuoteAggregate,
        PurchaseRequestAggregate,
        QuoteAggregate,
        QuoteDetail,
        RequestItem,
    },
};

pub fn map_create_request(dto: CreatePurchaseRequestDto) -> NewPurchaseRequest {
    NewPurchaseRequest {
        created_at: dto.created_at,
        employee_id: dto.employee_id,
        details: dto.details.into_iter().map(map_create_request_lines).collect(),
    }

}

pub fn map_create_request_lines(line: CreatePurchaseRequestDtoLine) -> NewPurchaseRequestLine {
    NewPurchaseRequestLine {
        product_id: line.product_id,
        quantity: line.quantity
    }
}

// =============================================================================
// GET /purchase-requests/:id
// =============================================================================

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
