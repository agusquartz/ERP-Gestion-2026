//The internal model - represents the database table
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Client{
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub ruc: String,
    pub address: Option<String>,
    pub email: String,
    pub birth_date: Option<NaiveDate>,
    pub credit_limit: f64,
    pub current_credit: f64,
}

//Phones are in a separate table because a client can have many
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Phone {
    pub id: i32,
    pub phone_number: String,
    pub is_emergency: bool,
}

pub struct ClientAggregate {
    pub client: Client,
    pub phones: Vec<Phone>,
}
