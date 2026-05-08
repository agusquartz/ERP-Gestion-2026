// ============================================================
// SERVICE
// ============================================================
use crate::db_config::DbError;

use crate::modules::purchase_request::dto::create::CreatePurchaseRequestDto;
use crate::modules::purchase_request::dto::response::PurchaseRequestResponseDto;
use crate::modules::purchase_request::dto::search::ProductSearchResponseDto;
use crate::modules::purchase_request::{mapper, repository};


    pub async fn create_purchase_request(
        dto: CreatePurchaseRequestDto,
    ) -> Result<PurchaseRequestResponseDto, DbError> {
        if dto.details.is_empty() {
            return Err(DbError::Other(
                "Purchase request must contain at least one detail".to_string(),
            ));
        }

        for detail in &dto.details {
            if detail.quantity <= 0 {
                return Err(DbError::Other(
                    "Product quantity must be greater than zero".to_string(),
                ));
            }
        }

        let data = repository::create_purchase_request(dto).await?;

        Ok(mapper::purchase_request_to_response(data))
    }

    pub async fn get_purchase_request_by_id(
        id: i32,
    ) -> Result<PurchaseRequestResponseDto, DbError> {
        let data = repository::get_purchase_request_by_id(id)
            .await?
            .ok_or(DbError::NotFound)?;

        Ok(mapper::purchase_request_to_response(data))
    }

    pub async fn get_purchase_requests(
        contains: Option<String>,
    ) -> Result<Vec<PurchaseRequestResponseDto>, DbError> {
        let data = repository::get_purchase_requests(contains).await?;

        Ok(data
            .into_iter()
            .map(mapper::purchase_request_to_response)
            .collect())
    }

    pub async fn search_products(
        contains: Option<String>,
    ) -> Result<Vec<ProductSearchResponseDto>, DbError> {
        let data = repository::search_products(contains).await?;

        Ok(data
            .into_iter()
            .map(mapper::product_search_to_response)
            .collect())
    }
