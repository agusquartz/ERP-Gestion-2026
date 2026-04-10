//What the API returns - never the raw Model
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientResponseDto {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub ruc: String,
    pub address: Option<String>,
    pub email: String,
    pub birth_date: Option<NaiveDate>,
    pub credit_limit: Decimal,
    pub current_credit: Decimal,
    pub phones: Vec<PhoneResponseDto>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase"]
pub struct PhoneResponseDto {
    pub id: i32,
    pub phone_number: String,
    pub is_emergency: bool,
}
