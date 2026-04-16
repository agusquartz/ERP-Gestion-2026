//! Quote Handler Layer
//!
//! Responsibilities:
//! - HTTP input/output
//! - Extract path/query/body
//! - Call service layer

use axum::{
    Json, 
    extract::{Path, Query},
    http::StatusCode,
};
use std::collections::HashMap;
use crate::modules::quote::service;
use crate::modules::quote::dto::{
    create::CreateQuoteDto,
    response::QuoteResponseDto,
};


/// POST /quotes
pub async fn create_quote_handler(
    Json(payload): Json<CreateQuoteDto>,
) -> Result<Json<QuoteResponseDto>, (StatusCode, String)> {

    match service::create_quote(payload).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
             StatusCode::BAD_REQUEST,
            e.to_string(),
        ))    
    }
}

/// GET /quotes/{id}
pub async fn get_quote_handler(
    Path(id): Path<i32>,
) -> Result<Json<QuoteResponseDto>, (StatusCode, String)> {

    match service::get_quote_by_id(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::NOT_FOUND,
            e.to_string(),
        )),
    }

}


/// GET /quotes?contains=string
pub async fn list_quotes_handler(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<QuoteResponseDto>>, (StatusCode, String)> {

    let contains = params.get("contains").cloned();

    match service::get_quotes(contains).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            e.to_string(),
        )),
   }
}
