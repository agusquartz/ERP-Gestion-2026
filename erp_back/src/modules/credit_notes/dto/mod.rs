pub mod create;
pub mod response;
use serde::{ Deserialize, Serialize };

/// Query parameters for credit notes listing endpoints.
///
/// # Responsibilities
/// - Captures optional filtering criteria from HTTP query string
/// - Passed to repository/service for query construction
///
/// # Fields
/// - `contains`: optional search term used to filter credit notes
#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct CreditNoteListQuery {
    pub contains: Option<String>,
}
