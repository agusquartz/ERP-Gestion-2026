//What POST receives - no id, no currentCredit
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]  //birthDate, creditLimit, etc
pub struct CreateClientDto {
    pub name: String,
    pub surname: String,
    pub ruc: String,
    pub address: String,
    pub email: String,
    pub birth_date: Option<NaiveDate>,
    pub credit_limit: Option<Decimal>,
    pub phones: Vec<CreatePhoneDto>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePhoneDto {
    pub phone_number: String,
    pub is_emergency: bool,
}
