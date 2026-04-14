use crate::shared::db_config;
use crate::modules::product;
/// Errors that can occur in the service layer.
///
/// Wraps lower-level errors and adds validation failures.
#[derive(Debug)]
pub enum ServiceError {
    //This error comes up when the database fails. It get's disconnected, corrupted
    //or fails for some unexpected reason
    Database(db_config::DbError),
    //Validation comes up when something is wrong in such a way that it violates business rules. 
    //Like, the dto came with a client_id that doesn't exist. Or some reference to a sale condition 
    //that doesn't exist. Basically, this error is the way the server has to tell you "I couldn't 
    //create an invoice because you're asking for things that can't be". It is different from NotFound 
    //because NotFound only happens when the client asks for an Invoice by id, or by a set of filters, 
    //and it simply isn't there.
    Validation(ValidationError),
    //NotFound is the error that comes up in the very normal case when the client is searching for
    //some invoice (via id, or maybe a set of filters) and there's none that matches its search
    //query. NotFound comes up when the resource our whole endpoint IS ABOUT isn't there.
    NotFound(Context),
    //This error signal that some service, out of our control (like products, clients,
    //credit notes) failed. It's distinct from Database because we want to know who's responsible
    //for the error.
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

/// Conversion from product service errors.
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

