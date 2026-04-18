//! # Quote DTOs (Data Transfer Objects)
//!
//! This module groups all the data shapes used at the API boundary for the quote domain.
//!
//! ## Why DTOs exist separately from models
//! Internal models ([`crate::modules::quote::model`]) are tightly coupled to the
//! database schema. DTOs define the **public API contract** — what callers send and
//! receive — independently of how data is stored. Benefits:
//! - Field names can differ from column names (camelCase vs snake_case)
//! - Fields absent from the API (e.g. `total`, auto-generated `id`) can be omitted
//!   from input DTOs without touching the model
//! - The API shape can evolve without requiring DB schema changes
//!
//! ## Sub-modules
//! - [`create`]   — shape of the `POST /quotes` request body
//! - [`response`] — shape of every quote JSON response
 
/// DTO for creating a new quote (`POST /quotes`).
pub mod create;

/// DTO returned in all quote API responses.
pub mod response;
