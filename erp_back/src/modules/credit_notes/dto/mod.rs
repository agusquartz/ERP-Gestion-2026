pub mod create;
pub mod response;
use serde::{ Deserialize, Serialize };
use chrono::NaiveDate;

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
    pub search: Option<String>,
    pub filter: Option<String>,
    pub status: Option<String>,
    pub since: Option<NaiveDate>,
    pub to: Option<NaiveDate>,
    pub cursor: Option<i32>,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

fn default_limit()-> i64 { 30 }
