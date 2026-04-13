pub mod create;
pub mod response;
use serde::{ Deserialize, Serialize };

/// Query parameters for credit notes listing endpoints.
///
/// # Responsibilities
/// - Captures optional filtering criteria from HTTP query string
/// - Deserialized from HTTP query parameters and passed into the service layer.
///   The service layer extracts relevant fields and translates them into
///   repository-level query inputs.
/// # Fields
/// - `contains`: optional search term used to filter credit notes
#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct CreditNoteListQuery {
    pub contains: Option<String>,
}
