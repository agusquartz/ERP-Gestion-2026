//! Invoice DTO module
//!
//! This module groups all Data Transfer Objects (DTOs) related to invoices.
//! DTOs define the external interface of the system, including request payloads,
//! response shapes, and query parameters.
//!
//! # Submodules
//! - `create`: structures for invoice creation requests
//! - `response`: structures returned to clients
//! - `update`: (currently unused) intended for invoice update operations
//!
//! # Notes
//! - DTOs are used at the HTTP boundary (handler layer)
//! - They are converted into domain models in the service layer
//! - They should remain free of business logic
pub mod create;
pub mod response;

use serde::{ Deserialize, Serialize };

/// Query parameters for invoice listing endpoints.
///
/// # Responsibilities
/// - Captures optional filtering criteria from HTTP query string
/// - Passed to repository/service for query construction
///
/// # Fields
/// - `contains`: optional search term used to filter invoices
#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct InvoiceListQuery {
    pub contains: Option<String>,
}
