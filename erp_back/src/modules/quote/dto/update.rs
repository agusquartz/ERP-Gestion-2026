//! Patch Quote DTO
//!
//! All fields optional because this is partial update.

use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchQuoteDto {
    pub client_id: Option<i32>,
    pub status_id: Option<i32>,
    pub created_at: Option<String>,
}
