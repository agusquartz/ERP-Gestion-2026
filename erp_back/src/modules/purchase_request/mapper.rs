use crate::modules::purchase_request::{
    dto::{
        response,
        create,
    },
    model,
    status
};

pub fn map_create_request(dto: create::CreatePurchaseRequestDto) -> model::NewPurchaseRequest {
    model::NewPurchaseRequest {
        created_at: dto.created_at,
        employee_id: dto.employee_id,
        details: dto.details.into_iter().map(map_create_request_lines).collect(),
    }

}

pub fn map_create_request_lines(line: create::CreatePurchaseRequestDtoLine) -> model::NewPurchaseRequestLine {
    model::NewPurchaseRequestLine {
        product_id: line.product_id,
        quantity: line.quantity
    }
}

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

pub fn map_create_quote_lines(detail: create::QuoteDetailLine) -> model::NewQuoteDetail {
    model::NewQuoteDetail {
        product_id: detail.product_id,
        confirmed_quantity: detail.confirmed_quantity,
        unit_cost: detail.unit_cost,
    }
}

/// Converts a full PurchaseRequestAggregate into the HTTP response DTO.
///
/// Receives:
///   aggregate — Built by the repository from joined DB rows
///
/// Returns:
///   PurchaseRequestResponse — the JSON payload sent to the frontend
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

/// Converts one RequestItem model into its response DTO.
///
/// Called per row when mapping the items list in a purchase request.
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

fn map_quote_detail(detail: model::QuoteDetail) -> response::PurchaseQuoteDetailResponse {
    response::PurchaseQuoteDetailResponse {
        product_id: detail.product.id,
        confirmed_quantity: detail.confirmed_quantity,
        unit_cost: detail.unit_cost,
    }
}


