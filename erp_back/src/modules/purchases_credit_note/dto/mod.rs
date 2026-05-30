pub mod create;
pub mod response;

use serde::{ Deserialize, Serialize};
use chrono::NaiveDate;

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct PurchaseCreditNoteListQuery {
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
