
use crate::shared::db_config;
use crate::modules::product;
#[derive(Debug)]
pub enum ServiceError {
    Database(db_config::DbError),
    Validation(ValidationError),
    NotFound(Context),
    Dependency(DependencyError),
}

#[derive(Debug)]
pub struct Context {
    pub entity: &'static str,
    pub id: Option<i32>,
}

#[derive(Debug)]
pub struct ValidationError {
    pub context: String,
}

#[derive(Debug)]
pub struct DependencyError {
    pub system: &'static str,
    pub message: String,
}

impl From<product::service::ServiceError> for ServiceError {
    fn from(err: product::service::ServiceError) -> Self {
        match err {
            product::service::ServiceError::Db(_) => {
                Self::Dependency( DependencyError{
                    system: "product", message: String::from("product database error")
                })
            },
            product::service::ServiceError::Validation(msg) => {
                Self::Dependency( DependencyError{ 
                    system: "product", message: msg 
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
        }
    }
}

impl std::error::Error for ServiceError {}

