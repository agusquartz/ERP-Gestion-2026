//! # Client DTOs (Data Transfer Objects)
//!
//! This module groups all the data shapes used at the API boundary for the client domain.
//!
//! DTOs are distinct from internal models ([`crate::modules::client::model`]) because:
//! - They define what external callers **send** and **receive** — the public API contract.
//! - They use `camelCase` JSON keys (via `#[serde(rename_all = "camelCase")]`)
//!   to match JavaScript/TypeScript conventions, while internal models use snake_case.
//! - They hide internal fields that callers should not see or set (e.g. `id`, `current_credit`
//!   are absent from the create DTO).
//! - They can evolve independently from the storage schema.
//!
//! ## Sub-modules
//! - [`create`]   — shape of the `POST /clients` request body
//! - [`update`]   — shape of the `PATCH /clients/{id}` request body
//! - [`response`] — shape of every client JSON response + `From<ClientAggregate>` conversions
 
/// DTO for creating a new client (`POST /clients`).
pub mod create;

/// DTO for partially updating a client (`PATCH /clients/{id}`).
pub mod response;

/// DTO returned in all client API responses, plus model-to-DTO conversion logic.
pub mod update;

