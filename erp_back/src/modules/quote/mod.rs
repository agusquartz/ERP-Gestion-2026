//! # Quote Module
//!
//! Root module for the `quote` domain. Re-exports all sub-modules that together
//! implement the full read/write lifecycle for quotes.
//!
//! ## Module structure
//!
//! ```text
//! quote/
//! ├── mod.rs         ← you are here — wires all sub-modules together
//! ├── model.rs       ← internal domain structs (Quote, QuoteDetail, QuoteWithDetails, …)
//! ├── repository.rs  ← all SQL queries and transactions
//! ├── mapper.rs      ← domain model → DTO conversions + row aggregation helpers
//! ├── service.rs     ← business logic, orchestration, error translation
//! ├── handler.rs     ← Axum HTTP handlers (request/response boundary)
//! ├── router.rs      ← route registration + auth middleware application
//! └── dto/
//!     ├── mod.rs     ← re-exports create and response sub-modules
//!     ├── create.rs  ← POST /quotes request body shape
//!     └── response.rs← JSON response shape for all quote endpoints
//! ```
//!
//! ## Data flow
//! ```text
//! HTTP Request
//!     → router.rs       (route match + auth middleware)
//!     → handler.rs      (extract path / query / body)
//!     → service.rs      (validate + orchestrate)
//!     → repository.rs   (execute SQL, build aggregates)
//!     → PostgreSQL
//!     ← repository.rs   (QuoteWithDetails)
//!     ← mapper.rs       (QuoteResponseDto)
//!     ← handler.rs      (StatusCode + Json)
//! HTTP Response
//! ```
//!
//! ## Layer responsibilities at a glance
//! | Layer | File | Does |
//! |---|---|---|
//! | Router | `router.rs` | Bind URLs to handlers, apply auth |
//! | Handler | `handler.rs` | HTTP I/O, call service |
//! | Service | `service.rs` | Business rules, orchestration |
//! | Repository | `repository.rs` | SQL, transactions, aggregation |
//! | Mapper | `mapper.rs` | Model → DTO conversion |
//! | Model | `model.rs` | Internal domain types |
//! | DTO | `dto/` | API contract types (input/output) |

pub mod dto;
pub mod mapper;
pub mod model;
pub mod repository;
pub mod service;
pub mod router;
pub mod handler;
