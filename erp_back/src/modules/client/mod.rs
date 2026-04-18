//! # Client Module
//!
//! Root module for the `client` domain. Re-exports all sub-modules that together
//! implement the full CRUD lifecycle for clients.
//!
//! ## Module structure
//!
//! ```text
//! client/
//! ├── mod.rs          ← you are here — wires all sub-modules together
//! ├── model.rs        ← internal domain structs (Client, Phone, ClientAggregate)
//! ├── repository.rs   ← all SQL queries and transactions
//! ├── service.rs      ← business logic orchestration and error mapping
//! ├── handler.rs      ← Axum HTTP handlers (request/response boundary)
//! ├── router.rs       ← route registration + auth middleware application
//! └── dto/
//!     ├── mod.rs      ← re-exports create, response, update
//!     ├── create.rs   ← POST /clients request body shape
//!     ├── update.rs   ← PATCH /clients/{id} request body shape
//!     └── response.rs ← JSON response shape + From<ClientAggregate> conversions
//! ```
//!
//! ## Data flow
//! ```text
//! HTTP Request
//!     → router.rs       (route match + auth middleware)
//!     → handler.rs      (extract path/query/body)
//!     → service.rs      (orchestrate + map errors)
//!     → repository.rs   (execute SQL)
//!     → PostgreSQL
//!     ← repository.rs   (ClientAggregate)
//!     ← service.rs      (ClientResponseDto via From)
//!     ← handler.rs      (StatusCode + Json)
//! HTTP Response
//! ```

pub mod dto;
pub mod model;
pub mod repository;
pub mod service;
pub mod handler;
pub mod router;
