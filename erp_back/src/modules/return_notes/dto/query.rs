use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReturnNoteListQuery {
    pub contains: Option<String>,
    pub status_id: Option<i32>,
    pub from_date: Option<NaiveDate>,
    pub to_date: Option<NaiveDate>,
    pub cursor: Option<i32>,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

fn default_limit()-> i64 { 30 }

