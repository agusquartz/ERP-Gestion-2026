
use crate::shared::db_config;
use crate::modules::product;

/// Unified error type for the purchase order service layer.
///
/// This enum represents all possible failures that can occur within the domain,
/// including persistence issues, validation failures, missing entities,
/// and external dependency failures.
///
/// It acts as the boundary between:
/// - domain/service logic
/// - transport layers (HTTP handlers, etc.)
#[derive(Debug)]
pub enum ServiceError {
    /// Errors originating from the database/repository layer.
    Database(db_config::DbError),
    /// Errors caused by invalid input or domain rule violations.
    Validation(ValidationError),
    /// Indicates that a requested entity does not exist.
    NotFound(Context),
    /// Errors originating from external dependencies (e.g., other modules/services).
    Dependency(DependencyError),
    InsufficientStock(StockError),
}



#[derive(Debug)]
pub struct StockError {
    pub product_id: i32,
}

/// Context information for "not found" errors.
///
/// Provides enough detail to identify what entity was missing.
#[derive(Debug)]
pub struct Context {
    /// Name of the entity (e.g., "purchase_order", "product").
    pub entity: &'static str,
    /// Optional identifier of the missing entity.
    pub id: Option<i32>,
}

/// Represents a validation error within the service layer.
///
/// Notes:
/// - Contains a free-form message describing the validation issue
/// - Can be extended later into structured field-level validation
#[derive(Debug)]
pub struct ValidationError {
    pub context: String,
}

/// Represents a failure in an external dependency.
///
/// Used when another module or system cannot fulfill its role.
///
/// Examples:
/// - Product module database failure
/// - External service outage
#[derive(Debug)]
pub struct DependencyError {
    /// Name of the external system/module.
    pub system: &'static str,
    /// Description of the failure.
    pub message: String,
}

/// Converts errors from the product service into purchase order service errors.
///
/// Mapping rules:
/// - Product DB errors → Dependency error (external system failure)
/// - Product validation errors → Purchase order validation error
///
/// Design intent:
/// - Preserves semantic meaning of validation failures
/// - Distinguishes between system failure and user input errors
impl From<product::service::ServiceError> for ServiceError {
    fn from(err: product::service::ServiceError) -> Self {
        match err {
            product::service::ServiceError::Db(_) => {
                Self::Dependency( DependencyError{
                    system: "product", message: String::from("product database error")
                })
            },
            product::service::ServiceError::Validation(msg) => {
                Self::Validation( ValidationError{ 
                    context: format!("Purchase Order Validation: {msg}")
                }) 
            },
        }
    }
}

/// Converts a database error into a service error.
impl From<db_config::DbError> for ServiceError {
    fn from(value: db_config::DbError) -> Self {
        Self::Database(value)
    }
}

/// Formats the error for user-facing messages or logs.
impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::Database(err) => write!(f, "database error: {}", err),
            ServiceError::Validation(err) => write!(f, "validation error: {}", err.context),
            ServiceError::NotFound(context) => match context.id {
                Some(id) => write!(f,"{} with id {} doesn't exist", context.entity, id),
                None => write!(f,"{} doesn't exist", context.entity)
            }
            ServiceError::Dependency(err) => write!(f,"{} system has failed, because: {}", err.system, err.message),


            ServiceError::InsufficientStock(err) => {
                write!(
                    f,
                    "insufficient stock for product ID {}",
                    err.product_id
                )
            }
        }
    }
}

impl std::error::Error for ServiceError {}

