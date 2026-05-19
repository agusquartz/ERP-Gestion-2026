use rust_decimal::Decimal;
use crate::modules::purchase_request::{
    dto::{
        response,
        create,
    },
    model,
    status
};

/// Maps a purchase request creation DTO into a domain model.
///
/// This is a pure transformation:
/// - no validation
/// - no database interaction
/// - no business rules
///
/// Only reshapes API input into domain-friendly structures.
pub fn map_create_request(dto: create::CreatePurchaseRequestDto) -> model::NewPurchaseRequest {
    model::NewPurchaseRequest {
        created_at: dto.created_at,
        employee_id: dto.employee_id,
        details: dto.details.into_iter().map(map_create_request_lines).collect(),
    }

}

/// Maps a purchase request line DTO into a domain request line.
pub fn map_create_request_lines(line: create::CreatePurchaseRequestDtoLine) -> model::NewPurchaseRequestLine {
    model::NewPurchaseRequestLine {
        product_id: line.product_id,
        quantity: line.quantity
    }
}

/// Maps a purchase quote creation DTO into a domain model.
///
/// `initial_status` is injected externally because:
/// - creation logic defines the initial lifecycle state
/// - DTOs must remain stateless
pub fn map_create_quote(dto: create::CreatePurchaseQuoteDto, initial_status: i32) -> model::NewQuote {
    model::NewQuote {
        created_at: dto.created_at,
        purchase_request_id: dto.purchase_request_id,
        supplier_id: dto.supplier_id,
        status_id: initial_status, //This mapping is only used on creation, therefore, can
                                           //have this bit of data in here
        details: dto.details.into_iter().map(map_create_quote_lines).collect(),
    }
}

/// Maps a quote detail DTO into a domain model line.
pub fn map_create_quote_lines(detail: create::CreateQuoteLineDto) -> model::NewQuoteDetail {
    model::NewQuoteDetail {
        product_id: detail.product_id,
        //Both these fields go with zero on creation
        confirmed_quantity: 0,
        unit_cost: Decimal::ZERO,
    }
}

/// Converts a domain aggregate into an API response DTO.
///
/// This function performs a full hydration mapping:
/// - request header
/// - employee
/// - request details
/// - associated quotes
///
/// No logic is applied; only structural transformation.
pub fn map_purchase_request(aggregate: model::PurchaseRequestAggregate) -> response::PurchaseRequestResponse {
    response::PurchaseRequestResponse {
        id:            aggregate.request.id,
        created_at:    aggregate.request.created_at,
        employee:      response::EmployeeSummaryResponse{
            id: aggregate.request.employee.id,
            name: aggregate.request.employee.name,
            surname: aggregate.request.employee.surname,
        },
        details:         aggregate.request.details.into_iter().map(map_request_item).collect(),
        quotes:        aggregate.quotes.into_iter().map(map_quote).collect(),
    }
}

/// Maps a purchase request line into its response representation.
fn map_request_item(item: model::RequestItem) -> response::PurchaseRequestItemsResponse {
    response::PurchaseRequestItemsResponse {
        product:    response::LineProductResponse {
            id: item.product.id,
            description: item.product.description,
            code: item.product.code,
            category: response::CategoryResponse {
                id: item.product.category.id,
                name: item.product.category.name,
            },
        },
        quantity:     item.quantity,
    }
}

/// Maps a quote domain model into its API response representation.
///
/// Includes supplier, status, lifecycle dates, and quote details.
fn map_quote(quote: model::Quote) -> response::PurchaseQuoteResponse {
    response::PurchaseQuoteResponse {
        id:            quote.id,
        supplier:   response::SupplierSummaryResponse {
            id: quote.supplier.id,
            name: quote.supplier.name,
            stamp: quote.supplier.stamp,
        },
        status:        response::StatusResponse{
            id: quote.status.id,
            name: quote.status.name,
        },
        created_at:    quote.created_at,
        date_sent:     quote.date_sent,
        date_received: quote.date_received,
        details:       quote.details.into_iter().map(map_quote_detail).collect(),
    }
}

/// Maps a quote detail domain model into response format.
fn map_quote_detail(detail: model::QuoteDetail) -> response::PurchaseQuoteDetailResponse {
    response::PurchaseQuoteDetailResponse {
        product_id: detail.product.id,
        confirmed_quantity: detail.confirmed_quantity,
        unit_cost: detail.unit_cost,
        enabled: detail.enabled,
    }
}


