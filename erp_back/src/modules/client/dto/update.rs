//PATCH - everything is Option<T> because only sent fields are updates
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchClientDto {
    pub name: Option<String>,
    pub surname: Option<String>,
    pub address: Option<String>,
    pub document: Option<String>,
    pub email: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub credit_limit: Option<f64>,
    pub current_credit: Option<f64>,
    pub phones: Option<Vec<PatchPhoneDto>>,
}


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPhoneDto {
    pub id: i32,
    pub phone_number: Option< String>,
    pub is_emergency: Option<bool>,
}
