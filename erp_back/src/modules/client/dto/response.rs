//! # Client Response DTO
//!
//! Defines the shape of the **JSON response** returned by all client endpoints.
//!
//! ## Why a separate response type?
//! The internal [`crate::modules::client::model::ClientAggregate`] struct is tightly
//! coupled to the database schema. Exposing it directly would:
//! - Leak internal field names (e.g. `curr_credit` vs `currentCredit`)
//! - Make it hard to add/remove response fields without touching the model
//! - Couple the public API contract to DB column naming conventions
//!
//! Response DTOs act as an anti-corruption layer: the API contract can evolve
//! independently from the storage layer.
//!
//! ## Conversion
//! Both [`ClientResponseDto`] and [`PhoneResponseDto`] implement `From<T>` for
//! their respective model types, enabling clean `.into()` / `Into::into()` calls
//! in the service layer without boilerplate mapping code spread across files.
 

use crate::modules::client::model::ClientAggregate;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};


// ─────────────────────────────────────────────────────────────────────────────
// From implementations — model → DTO conversions
// ─────────────────────────────────────────────────────────────────────────────

/// Converts a [`ClientAggregate`] (model + phones) into the public-facing
/// [`ClientResponseDto`].
///
/// Called in the service layer via `Into::into(result)` after every repository
/// operation so that HTTP handlers never deal with raw model types.

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
            // Each Phone model is independently converted via its own From impl below
            phones: agg.phones
                .into_iter()
                .map(PhoneResponseDto::from)
                .collect(),
        }
    }
}


/// Converts a [`crate::modules::client::model::Phone`] into [`PhoneResponseDto`].
///
/// Used inside the `From<ClientAggregate>` implementation above to map
/// each element of `agg.phones` into its DTO equivalent.
impl From<crate::modules::client::model::Phone> for PhoneResponseDto {
    fn from(p: crate::modules::client::model::Phone) -> Self {
        PhoneResponseDto {
            id: p.id,
            phone_number: p.phone_number,
            is_emergency: p.is_emergency,
        }
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// DTO structs
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListClientView {
    pub clients: Vec<ClientResponseDto>,
    pub has_more: bool,
}

/// The JSON object returned for a client in every endpoint response.
///
/// All field names are serialized in `camelCase` to match JavaScript/TypeScript
/// conventions on the consuming front-end.
///
/// # Example JSON
/// ```json
/// {
///   "id": 1,
///   "name": "John",
///   "surname": "Doe",
///   "document": "1234567",
///   "address": "123 Main St",
///   "email": "john@example.com",
///   "birthDate": "1990-05-20",
///   "creditLimit": 5000.0,
///   "currentCredit": 1200.0,
///   "phones": [
///     { "id": 1, "phoneNumber": "0981123456", "isEmergency": false }
///   ]
/// }
/// ```

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientResponseDto {
    /// Database-generated primary key.
    pub id: i32,    
    
    /// Client's first name.
    pub name: String,
    
    /// Client's last name.
    pub surname: String,
    
    /// National ID or document number.
    pub document: String,
    
    /// Optional mailing/physical address.
    pub address: Option<String>,
    
    /// Contact email address.
    pub email: String,
    
    /// Date of birth. Serialized as `"YYYY-MM-DD"`.
    pub birth_date: Option<NaiveDate>,
    
    /// Maximum credit this client is allowed to use.
    pub credit_limit: f64,
    
    /// Credit amount already consumed by the client.
    pub current_credit: f64,
    
    /// All phone numbers registered for this client.
    /// An empty array `[]` means no phones are associated yet.
    pub phones: Vec<PhoneResponseDto>,
}

/// Nested phone object within [`ClientResponseDto`].
///
/// # Example JSON
/// ```json
/// { "id": 1, "phoneNumber": "0981123456", "isEmergency": true }
/// ```

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhoneResponseDto {
    /// Database-generated primary key of the phone record.
    pub id: i32,
    
    /// The phone number string.
    pub phone_number: String,

    /// Whether this number is designated as an emergency contact.    
    pub is_emergency: bool,
}
