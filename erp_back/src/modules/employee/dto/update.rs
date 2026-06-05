use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchClientDto {
    /// New first name. If `None`, the existing value is kept.
    pub name: Option<String>,

    /// New last name. If `None`, the existing value is kept.
    pub surname: Option<String>,
    
    /// New address. If `None`, the existing value is kept.
    pub address: Option<String>,
    
    /// New document number. If `None`, the existing value is kept.
    pub document: Option<String>,
    
    /// New email address. If `None`, the existing value is kept.
    pub email: Option<String>,
    
    /// New date of birth. If `None`, the existing value is kept.
    pub birth_date: Option<NaiveDate>,
    
    /// New credit limit. If `None`, the existing value is kept.
    pub credit_limit: Option<f64>,
    
    /// New current credit value. If `None`, the existing value is kept.
    /// Note: in normal business flows, `current_credit` is updated by
    /// billing/payment operations, not by direct PATCH. This field is
    /// exposed here for administrative overrides.
    pub current_credit: Option<f64>,
    
    /// New list of phone numbers. If `Some(...)`, **replaces** all existing
    /// phone entries for this client (delete-then-insert in a transaction).
    /// If `None`, existing phones are untouched.
    pub phones: Option<Vec<PatchPhoneDto>>,
}


/// Represents a single phone entry within a PATCH request.
///
/// The `id` field is accepted from the client but is **not used** by the
/// current repository implementation — the PATCH strategy deletes all pivot
/// links and re-inserts new phone rows. It is included here for API
/// forward-compatibility (e.g., if a future version implements delta updates).
///
/// # Example JSON
/// ```json
/// { "id": 3, "phoneNumber": "0991000000", "isEmergency": true }
/// ```

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPhoneDto {
    /// The existing phone ID. Currently unused in the repository logic,
    /// retained for potential future use in partial phone updates.
    pub id: i32,

    /// New phone number string. If `None`, not used (current impl replaces all).
    pub phone_number: Option< String>,

    /// New emergency flag. If `None`, not used (current impl replaces all).
    pub is_emergency: Option<bool>,
}
