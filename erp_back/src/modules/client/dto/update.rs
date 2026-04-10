//PATCH - everything is Option<T> because only sent fields are updates
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchClientDto {
    pub name: Option<String>,
    pub surname: Option<String>,
    pub address: Option<String>,
    pub ruc: Option<String>,
    pub email: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub credit_limit: Option<Decimal>,
    pub current_credit: Option<Decimal>,
    pub phones: Option<Vec<PatchPhoneDto>>,
}


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPhoneDto {
    pub id: i32,
    pub phone_number: String,
    pub is_emergency: bool,
}
