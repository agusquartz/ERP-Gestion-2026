use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use crate::db_config;

#[derive(Debug)]
pub enum ServiceError {
	Database(db_config::DbError),
}

impl From<db_config::DbError> for ServiceError {
	fn from(e: db_config::DbError) -> Self {
		ServiceError::Database(e)
	}
}

impl IntoResponse for ServiceError {
	fn into_response(self) -> Response {
		match &self {
			ServiceError::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
		}
		.into_response()
	}
}