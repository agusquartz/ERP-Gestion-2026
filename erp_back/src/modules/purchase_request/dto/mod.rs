//! dto/mod.rs — purchase_request module
//!
//! This file declares and re-exports all Data Transfer Object submodules.
//!
//! DTOs define the exact shape of data coming IN from the frontend
//! (request bodies) and going OUT to the frontend (response bodies).
//!
//! They are intentionally separate from the model structs so that:
//!   - Internal DB fields are never accidentally exposed
//!   - The API contract is explicit and stable
//!   - Each file has a single clear responsibility
//!
//! Submodules:
//!   create   — Request bodies for POST endpoints (creating new records)
//!   update   — Request bodies for PATCH endpoints (updating existing records)
//!   response — Response bodies for all endpoints (what the frontend receives)

use serde::{Serialize, Deserialize};

pub mod create;
pub mod response;
pub mod search;


#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct PurchaseRequestListQuery {
    pub contains: Option<String>,
}
