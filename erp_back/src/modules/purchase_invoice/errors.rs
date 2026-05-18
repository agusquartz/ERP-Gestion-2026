//! Purchase invoice service error types
//!
//! Mirrors `purchase_order::errors` exactly — same variants, same structure.
//! Added `IntoResponse` so handlers can use `e.into_response()` instead of
//! manually mapping to status codes.
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

use crate::shared::db_config;
use crate::modules::product;
use crate::modules::purchase_order;

/// Unified error type for the purchase invoice service layer.
///
/// Acts as the boundary between domain/service logic and transport layers.
/// Each variant maps to a distinct HTTP status code in `IntoResponse`.
#[derive(Debug)]
pub enum ServiceError {
    /// Errors originating from the database or repository layer.
    Database(db_config::DbError),
    /// Errors caused by invalid input or violated domain rules.
    Validation(ValidationError),
    /// Indicates a requested entity does not exist.
    NotFound(Context),
    /// Errors originating from external module dependencies.
    Dependency(DependencyError),
}

/// Context for `NotFound` errors — identifies which entity was missing.
#[derive(Debug)]
pub struct Context {
    /// Name of the missing entity, e.g. `"purchase_invoice"`.
    pub entity: &'static str,
    /// Optional ID of the missing entity.
    pub id: Option<i32>,
}

/// A free-form validation failure message.
///
/// Can be extended later into structured field-level errors if needed.
#[derive(Debug)]
pub struct ValidationError {
    pub context: String,
}

/// Failure originating from an external module or system.
#[derive(Debug)]
pub struct DependencyError {
    /// Name of the external system, e.g. `"product"`.
    pub system: &'static str,
    /// Human-readable description of the failure.
    pub message: String,
}

// ── From conversions ──────────────────────────────────────────────────────────

/// Maps product service errors into purchase invoice service errors.
///
/// - DB errors from product → `Dependency` (external system failure)
/// - Validation errors from product → `Validation` (propagated with context)
impl From<product::service::ServiceError> for ServiceError {
    fn from(err: product::service::ServiceError) -> Self {
        match err {
            product::service::ServiceError::Db(_) => {
                Self::Dependency(DependencyError {
                    system:  "product",
                    message: String::from("product database error"),
                })
            }
            product::service::ServiceError::Validation(msg) => {
                Self::Validation(ValidationError {
                    context: format!("Purchase Invoice Validation: {msg}"),
                })
            }
        }
    }
}

/// Maps database errors directly into `ServiceError::Database`.
impl From<db_config::DbError> for ServiceError {
    fn from(value: db_config::DbError) -> Self {
        Self::Database(value)
    }
}

impl From<purchase_order::errors::ServiceError> for ServiceError {
    fn from(err: purchase_order::errors::ServiceError) -> Self {
        match err {
            _ => Self::Dependency(DependencyError {
                system:  "purchase_order",
                message: String::from("purchase order service error"),
            }),
        }
    }
}

impl From<tokio_postgres::Error> for ServiceError {
    fn from(e: tokio_postgres::Error) -> Self {
        Self::Database(db_config::DbError::from(e))
    }
}

// ── Display ───────────────────────────────────────────────────────────────────

impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::Database(err)   => write!(f, "database error: {}", err),
            ServiceError::Validation(err) => write!(f, "validation error: {}", err.context),
            ServiceError::NotFound(ctx)   => match ctx.id {
                Some(id) => write!(f, "{} with id {} doesn't exist", ctx.entity, id),
                None     => write!(f, "{} doesn't exist", ctx.entity),
            },
            ServiceError::Dependency(err) => {
                write!(f, "{} system has failed, because: {}", err.system, err.message)
            }
        }
    }
}

impl std::error::Error for ServiceError {}

// ── HTTP mapping ──────────────────────────────────────────────────────────────

/// Maps each error variant to the appropriate HTTP status code.
///
/// - `NotFound`   → 404
/// - `Validation` → 422 Unprocessable Entity
/// - `Database` / `Dependency` → 500 Internal Server Error
impl IntoResponse for ServiceError {
    fn into_response(self) -> Response {
        match self {
            ServiceError::NotFound(_)             => StatusCode::NOT_FOUND,
            ServiceError::Validation(_)           => StatusCode::UNPROCESSABLE_ENTITY,
            ServiceError::Database(_)
            | ServiceError::Dependency(_)         => StatusCode::INTERNAL_SERVER_ERROR,
        }
        .into_response()
    }
}