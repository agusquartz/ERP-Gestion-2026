//! # Accounting Router
//!
//! Registers all HTTP routes for the accounting module and applies
//! authentication middleware.
//!
//! ## Route table
//!
//! | Method | Path                                  | Description                         |
//! |--------|---------------------------------------|-------------------------------------|
//! | GET    | /accounting/processes                 | List accounting processes           |
//! | GET    | /accounting/processes/{id}            | Get accounting process by ID        |
//! | GET    | /accounting/chart-of-accounts         | List chart of accounts              |
//! | GET    | /accounting/chart-of-accounts/{id}    | Get chart account by ID             |
//! | GET    | /accounting/journal-entries           | List journal entries                |
//! | POST   | /accounting/journal-entries           | Create journal entry                |
//! | GET    | /accounting/journal-entries/{id}      | Get journal entry by ID             |
//! | PATCH  | /accounting/journal-entries/{id}      | Update journal entry                |
//! | DELETE | /accounting/journal-entries/{id}      | Delete journal entry                |
//! | GET    | /accounting/modules                   | List modules                        |
//! | GET    | /accounting/closures                  | List accounting closures            |
//! | POST   | /accounting/closures                  | Create accounting closure           |
//! | GET    | /accounting/closures/{id}             | Get accounting closure by ID        |
//! | PATCH  | /accounting/closures/{id}             | Update accounting closure           |
//! | DELETE | /accounting/closures/{id}             | Delete accounting closure           |
//! | GET    | /accounting/entry-models              | List entry models                   |
//! | GET    | /accounting/entry-models/{id}         | Get entry model by ID               |
//!
//! ## Authentication
//! All routes are wrapped with [`protect_routes`].

use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::modules::auth::middleware::auth::protect_routes;
use crate::modules::accounting::handler;

/// Builds and returns the [`Router`] for all accounting endpoints.
///
/// # Example
/// ```rust
/// let app = Router::new()
///     .merge(accounting_router());
/// ```
pub fn accounting_router() -> Router {
    let protected = Router::new()
        // ─────────────────────────────────────────────────────────────────────
        // ACCOUNTING PROCESSES
        // ─────────────────────────────────────────────────────────────────────

        // GET /accounting/processes
        .route(
            "/accounting/processes",
            get(handler::list_accounting_processes_handler),
        )

        // GET /accounting/processes/{id}
        .route(
            "/accounting/processes/{id}",
            get(handler::get_accounting_process_handler),
        )

        // ─────────────────────────────────────────────────────────────────────
        // CHART OF ACCOUNTS
        // ─────────────────────────────────────────────────────────────────────

        // GET /accounting/chart-of-accounts
        .route(
            "/accounting/chart-of-accounts",
            get(handler::list_chart_of_accounts_handler),
        )

        // GET /accounting/chart-of-accounts/{id}
        .route(
            "/accounting/chart-of-accounts/{id}",
            get(handler::get_chart_account_handler),
        )

        // ─────────────────────────────────────────────────────────────────────
        // JOURNAL ENTRIES
        // ─────────────────────────────────────────────────────────────────────

        // GET  /accounting/journal-entries
        // POST /accounting/journal-entries
        .route(
            "/accounting/journal-entries",
            get(handler::list_journal_entries_handler)
                .post(handler::create_journal_entry_handler),
        )

        // GET    /accounting/journal-entries/{id}
        // PATCH  /accounting/journal-entries/{id}
        // DELETE /accounting/journal-entries/{id}
        .route(
            "/accounting/journal-entries/{id}",
            get(handler::get_journal_entry_handler)
                .patch(handler::update_journal_entry_handler)
                .delete(handler::delete_journal_entry_handler),
        )

        // ─────────────────────────────────────────────────────────────────────
        // MODULES
        // ─────────────────────────────────────────────────────────────────────

        // GET /accounting/modules
        .route(
            "/accounting/modules",
            get(handler::list_accounting_modules_handler),
        )

        // ─────────────────────────────────────────────────────────────────────
        // ACCOUNTING CLOSURES
        // ─────────────────────────────────────────────────────────────────────

        // GET  /accounting/closures
        // POST /accounting/closures
        .route(
            "/accounting/closures",
            get(handler::list_accounting_closures_handler)
                .post(handler::create_accounting_closure_handler),
        )

        // GET    /accounting/closures/{id}
        // PATCH  /accounting/closures/{id}
        // DELETE /accounting/closures/{id}
        .route(
            "/accounting/closures/{id}",
            get(handler::get_accounting_closure_handler)
                .patch(handler::update_accounting_closure_handler)
                .delete(handler::delete_accounting_closure_handler),
        )

        // ─────────────────────────────────────────────────────────────────────
        // ENTRY MODELS
        // ─────────────────────────────────────────────────────────────────────

        // GET /accounting/entry-models
        .route(
            "/accounting/entry-models",
            get(handler::list_entry_models_handler),
        )

        // GET /accounting/entry-models/{id}
        .route(
            "/accounting/entry-models/{id}",
            get(handler::get_entry_model_handler),
        );

    protect_routes(protected)
}