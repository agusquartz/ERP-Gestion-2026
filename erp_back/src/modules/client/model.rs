//The internal model - represents the database table
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Client{
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub ruc: String,
    pub address: Option<String>,
    pub email: String,
    pub birtd_date: Option<NaiveDate>,
    pub credit_limit: Decimal,
    pub current_credit: Decimal,
}

//Phones are in a separate table because a client can have many
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PhoneNumber {
    pub id: i32,
    pub phone_number: String,
    pub is_emergency: bool,
}
