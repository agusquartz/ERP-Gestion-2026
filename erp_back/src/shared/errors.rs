use crate::shared::db_config::DbError;
use thiserror::Error;

//This enum encapsulates all errors we could have in our application.
//We'll add items as we have to 
//The kind of error that accumulate here may still change
#[derive(Debug, Error)]
pub enum AppError {
    //This error wraps all the problems our DB throws
    #[error("The database had a problem")]
    DatabaseError(#[from]DbError),

    //This error comes up when you try to get a user that doesn't exist.
    #[error("User not found: {0}")]
    UserNotFound(String),
}
