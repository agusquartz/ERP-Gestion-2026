//What the API returns - never the raw Modeli
use crate::modules::client::model::ClientAggregate;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

impl From<ClientAggregate> for ClientResponseDto {
    fn from(agg: ClientAggregate) -> Self {
        ClientResponseDto {
            id: agg.client.id,
            name: agg.client.name,
            surname: agg.client.surname,
            document: agg.client.document,
            address: agg.client.address,
            email: agg.client.email,
            birth_date: agg.client.birth_date,
            current_credit: agg.client.current_credit,
            credit_limit: agg.client.credit_limit,
            phones: agg.phones
                .into_iter()
                .map(PhoneResponseDto::from)
                .collect(),
        }
    }
}

impl From<crate::modules::client::model::Phone> for PhoneResponseDto {
    fn from(p: crate::modules::client::model::Phone) -> Self {
        PhoneResponseDto {
            id: p.id,
            phone_number: p.phone_number,
            is_emergency: p.is_emergency,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientResponseDto {
    pub id: i32,    
    pub name: String,
    pub surname: String,
    pub document: String,
    pub address: Option<String>,
    pub email: String,
    pub birth_date: Option<NaiveDate>,
    pub credit_limit: f64,
    pub current_credit: f64,
    pub phones: Vec<PhoneResponseDto>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhoneResponseDto {
    pub id: i32,
    pub phone_number: String,
    pub is_emergency: bool,
}
